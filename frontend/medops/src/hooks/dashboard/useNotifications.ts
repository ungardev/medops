import { useQuery } from "@tanstack/react-query";
import { DashboardAPI } from "@/api/dashboard";
import {
  NotificationEvent,
  AppointmentSummary,
  PaymentSummary,
} from "@/types/dashboard";

const MAX_NOTIFICATIONS = 3;

export function useNotifications() {
  return useQuery<NotificationEvent[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const events: NotificationEvent[] = [];

      // 📌 Citas del día
      let appointments: AppointmentSummary[] = [];
      try {
        appointments = await DashboardAPI.appointmentsToday();
      } catch (err) {
        console.warn("Appointments endpoint error:", err);
      }

      appointments.forEach((appt) => {
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
      });

      // 📌 Sala de espera (blindado)
      let waitingRoom: AppointmentSummary[] = [];
      try {
        waitingRoom = await DashboardAPI.waitingRoomToday();
      } catch (err) {
        console.warn("WaitingRoom endpoint error:", err);
        waitingRoom = []; // ✅ fallback institucional
      }

      waitingRoom.forEach((entry) => {
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
      });

      // 📌 Pagos recientes
      let payments: PaymentSummary[] = [];
      try {
        payments = await DashboardAPI.payments();
      } catch (err) {
        console.warn("Payments endpoint error:", err);
        payments = []; // ✅ fallback institucional
      }

      payments.forEach((pay) => {
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
          action:
            pay.status === "pending"
              ? {
                  href: `/charge-orders/${pay.charge_order}`,
                  label: "Registrar Pago",
                }
              : {
                  href: `/charge-orders/${pay.charge_order}`,
                  label: "Ver orden",
                },
        });
      });

      // 📌 Orden cronológico descendente
      events.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // 📌 Limitar a las más recientes
      const limitedEvents = events.slice(0, MAX_NOTIFICATIONS);

      // 📌 Mensaje institucional si todo está vacío
      if (limitedEvents.length === 0) {
        limitedEvents.push({
          id: 0,
          timestamp: new Date().toISOString(),
          actor: "Sistema",
          entity: "Dashboard",
          entity_id: 0,
          message: "Sin actividad registrada",
          severity: "info",
          notify: false,
        });
      }

      console.log("Notifications events:", limitedEvents);
      return limitedEvents;
    },
    staleTime: 60_000,
  });
}
