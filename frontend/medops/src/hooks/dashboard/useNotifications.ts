// src/hooks/dashboard/useNotifications.ts
import { useQuery } from "@tanstack/react-query";
import { DashboardAPI } from "@/api/dashboard";
import {
  NotificationEvent,
  AppointmentSummary,
  PaymentSummary,
} from "@/types/dashboard";
import { useAuthToken } from "@/hooks/useAuthToken";

const MAX_NOTIFICATIONS = 3;

function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && Array.isArray((raw as any).results)) {
    return (raw as any).results as T[];
  }
  return [];
}

export function useNotifications() {
  const { token } = useAuthToken();

  const query = useQuery<NotificationEvent[]>({
    queryKey: ["notifications", token],
    enabled: !!token,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const events: NotificationEvent[] = [];

      try {
        const raw = await DashboardAPI.appointmentsToday();
        const appointments = toArray<AppointmentSummary>(raw);
        console.log("🔍 appointmentsToday:", appointments);
        for (const appt of appointments) {
          events.push({
            id: appt.id,
            timestamp: appt.appointment_date,
            actor: appt.patient.full_name,
            entity: "Appointment",
            entity_id: appt.id,
            message: `Nueva cita creada para ${appt.patient.full_name}`,
            severity: "info",
            notify: false,
            action: { href: `/appointments/${appt.id}`, label: "Ver cita" },
          });
        }
      } catch (err) {
        console.warn("⚠️ Error en appointmentsToday:", err);
      }

      try {
        const raw = await DashboardAPI.waitingRoomToday();
        const waiting = toArray<AppointmentSummary>(raw);
        console.log("🔍 waitingRoomToday:", waiting);
        for (const entry of waiting) {
          events.push({
            id: entry.id,
            timestamp: entry.appointment_date,
            actor: entry.patient.full_name,
            entity: "WaitingRoom",
            entity_id: entry.id,
            message: `Paciente ${entry.patient.full_name} entró a la sala de espera`,
            severity: "success",
            notify: false,
            action: { href: `/waitingroom/${entry.id}`, label: "Ver entrada" },
          });
        }
      } catch (err) {
        console.warn("⚠️ Error en waitingRoomToday:", err);
      }

      try {
        const raw = await DashboardAPI.payments();
        const payments = toArray<PaymentSummary>(raw);
        console.log("🔍 payments:", payments);
        for (const pay of payments) {
          const severity =
            pay.status === "confirmed"
              ? "success"
              : pay.status === "pending"
              ? "warning"
              : "critical";
          events.push({
            id: pay.id,
            timestamp: pay.received_at ?? pay.appointment_date,
            actor: pay.patient.full_name,
            entity: "Payment",
            entity_id: pay.charge_order,
            message: `Orden #${pay.charge_order}: pago ${pay.status} de ${pay.amount} ${pay.currency} (${pay.method})`,
            severity,
            notify: false,
            action: {
              href: `/charge-orders/${pay.charge_order}`,
              label: pay.status === "pending" ? "Registrar Pago" : "Ver orden",
            },
          });
        }
      } catch (err) {
        console.warn("⚠️ Error en payments:", err);
      }

      events.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      console.log("🔍 eventos generados:", events);

      const top3 = events.slice(0, MAX_NOTIFICATIONS);

      if (top3.length === 0) {
        console.log("🔍 fallback activado: sin actividad registrada");
        return [
          {
            id: 0,
            timestamp: new Date().toISOString(),
            actor: "Sistema",
            entity: "Dashboard",
            entity_id: 0,
            message: "Sin actividad registrada",
            severity: "info",
            notify: false,
          },
        ];
      }

      return top3;
    },
  });

  return query;
}
