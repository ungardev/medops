// src/components/Dashboard/NotificationsFeed.tsx
import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/dashboard/useNotifications";
import { NotificationEvent } from "@/types/dashboard";
import moment from "moment";
import RegisterPaymentModal from "./RegisterPaymentModal";
import AppointmentDetail from "@/components/Appointments/AppointmentDetail";
import { useAppointment } from "@/hooks/appointments/useAppointments";
import NotificationBadge from "@/components/Dashboard/NotificationBadge";

// 🔹 Util institucional para blindar listas
function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && Array.isArray((raw as any).results)) {
    return (raw as any).results as T[];
  }
  return [];
}

// 🔹 Type guards para entidades conocidas
function isPayment(n: NotificationEvent) {
  return n.entity === "Payment";
}
function isAppointment(n: NotificationEvent) {
  return n.entity === "Appointment";
}
function isWaitingRoom(n: NotificationEvent) {
  return n.entity === "WaitingRoom";
}
function isDashboard(n: NotificationEvent) {
  return n.entity === "Dashboard";
}

function AppointmentDetailWrapper({
  appointmentId,
  onClose,
}: {
  appointmentId: number;
  onClose: () => void;
}) {
  const { data: appointment, isLoading, isError } = useAppointment(appointmentId);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <p className="bg-white dark:bg-gray-800 p-4 rounded ring-1 ring-gray-200 dark:ring-gray-700 text-sm text-[#0d2c53] dark:text-gray-200">
          Cargando cita...
        </p>
      </div>
    );
  }

  if (isError || !appointment) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <p className="bg-white dark:bg-gray-800 p-4 rounded ring-1 ring-gray-200 dark:ring-gray-700 text-sm text-red-600 dark:text-red-400">
          Error cargando cita
        </p>
        <button
          onClick={onClose}
          className="ml-2 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-sm"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return <AppointmentDetail appointment={appointment} onClose={onClose} onEdit={() => onClose()} />;
}

export default function NotificationsFeed() {
  const { data, isLoading, refetch } = useNotifications();
  const [selectedChargeOrder, setSelectedChargeOrder] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => refetch(), 500);
    return () => clearTimeout(timeout);
  }, [refetch]);

  const notifications = toArray<NotificationEvent>(data).slice(0, 6);

  // 🔹 Mensaje sintetizado por entidad (tip-safe)
  const renderMessage = (n: NotificationEvent) => {
    if (isPayment(n)) {
      return `Pago confirmado para orden #${n.entity_id}`;
    }
    if (isAppointment(n)) {
      return `Cita actualizada (#${n.entity_id})`;
    }
    if (isWaitingRoom(n)) {
      return `Paciente retirado de la sala de espera`;
    }
    if (isDashboard(n)) {
      // Mensaje genérico de auditoría/actividad del dashboard
      return n.message ?? "Actividad registrada en el dashboard";
    }
    // Fallback institucional
    return n.message ?? "Evento registrado";
  };

  // 🔹 Acción por entidad (tip-safe y con guardas)
  const resolveAction = (n: NotificationEvent) => {
    if (isAppointment(n)) {
      return () => setSelectedAppointmentId(n.entity_id);
    }
    if (isPayment(n)) {
      return () => setSelectedChargeOrder(n.entity_id);
    }
    if (isWaitingRoom(n)) {
      return () => {
        window.location.href = "/waitingroom";
      };
    }
    // Acción navegable si existe href
    if (n.action && typeof n.action.href === "string" && n.action.href.length > 0) {
      return () => {
        window.location.href = n.action!.href!;
      };
    }
    return () => {};
  };

  // 🔹 Badge por entidad (solo AuditAction válidos)
  const resolveBadge = (n: NotificationEvent): "create" | "update" | "delete" | "other" => {
    if (isPayment(n)) return "create";
    if (isAppointment(n)) return "update";
    if (isWaitingRoom(n)) return "delete";
    // Dashboard u otros eventos no categorizados
    return "other";
  };

  return (
    <section className="h-full bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 rounded-md p-3 sm:p-4 flex flex-col">
      {/* Header compacto */}
      <div className="h-9 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#0d2c53] dark:text-white">Notificaciones</h3>
      </div>

      {/* Feed scrollable */}
      <div className="flex-1 mt-3 overflow-y-auto">
        <ul className="space-y-2">
          {isLoading ? (
            <li className="text-sm text-gray-500 dark:text-gray-400">Cargando notificaciones...</li>
          ) : notifications.length === 0 ? (
            <li className="text-sm text-gray-500 dark:text-gray-400">No hay notificaciones recientes.</li>
          ) : (
            notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={resolveAction(n)}
                  className="w-full text-left p-3 rounded transition flex flex-col gap-1 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <NotificationBadge action={resolveBadge(n)} />
                    <span className="truncate text-sm font-medium text-[#0d2c53] dark:text-white">
                      {renderMessage(n)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {moment(n.timestamp).fromNow()}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Modales */}
      {selectedChargeOrder && (
        <RegisterPaymentModal
          chargeOrderId={selectedChargeOrder}
          onClose={() => setSelectedChargeOrder(null)}
          onSuccess={() => setSelectedChargeOrder(null)}
        />
      )}

      {selectedAppointmentId && (
        <AppointmentDetailWrapper
          appointmentId={selectedAppointmentId}
          onClose={() => setSelectedAppointmentId(null)}
        />
      )}
    </section>
  );
}
