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
      const appointments: AppointmentSummary[] =
        await DashboardAPI.appointmentsToday();

      let waitingRoom: AppointmentSummary[] = [];
      try {
        waitingRoom = await DashboardAPI.waitingRoomToday();
      } catch (err) {
        console.warn("WaitingRoom endpoint forbidden:", err);
      }

      const payments: PaymentSummary[] = await DashboardAPI.payments();

      const events: NotificationEvent[] = [];

      // 📌 Citas del día
      appointments.forEach((appt) => {
        events.push({
          id: appt.id,
          timestamp: appt.appointment_date,
          actor: appt.patient.full_name,
          entity: "Appointment",
          entity_id: appt.id,
          message: "Nueva cita creada",
          severity: "info",
          notify: false,
          action: { href: `/appointments/${appt.id}`, label: "Ver cita" },
        });
      });

      // 📌 Sala de espera
      waitingRoom.forEach((entry) => {
        events.push({
          id: entry.id,
          timestamp: entry.appointment_date,
          actor: entry.patient.full_name,
          entity: "WaitingRoom",
          entity_id: entry.id,
          message: "Paciente entró a la sala de espera",
          severity: "success",
          notify: false,
          action: { href: `/waitingroom/${entry.id}`, label: "Ver entrada" },
        });
      });

      // 📌 Pagos recientes
      payments.forEach((pay) => {
        events.push({
          id: pay.id,
          timestamp: pay.received_at ?? pay.appointment_date,
          actor: pay.patient.full_name,
          entity: "Payment",
          entity_id: pay.id,
          message: `Pago ${pay.status} de ${pay.amount} ${pay.currency} (${pay.method})`,
          severity:
            pay.status === "confirmed"
              ? "success"
              : pay.status === "pending"
              ? "warning"
              : "critical",
          notify: false,
          action: { href: `/payments/${pay.id}`, label: "Ver pago" },
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
