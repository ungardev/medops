// src/components/Dashboard/NotificationsFeed.tsx
import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/dashboard/useNotifications";
import { NotificationEvent } from "@/types/notifications";
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

  console.log("📦 Raw data desde useNotifications:", data);

  const notifications = toArray<NotificationEvent>(data).slice(0, 6);

  console.log("📋 Notificaciones procesadas:", notifications);

  const handleAction = (n: NotificationEvent) => {
    console.log("🧠 Acción disparada para notificación:", n);
    if (n.category?.startsWith("appointment") && n.entity_id) {
      setSelectedAppointmentId(n.entity_id);
    } else if (n.category?.startsWith("payment") && n.entity_id) {
      setSelectedChargeOrder(n.entity_id);
    } else if (n.action_href) {
      window.location.href = n.action_href;
    }
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
            notifications.map((n) => {
              console.log("🔔 Renderizando notificación:", n);
              return (
                <li key={n.id}>
                  <button
                    onClick={() => handleAction(n)}
                    className="w-full text-left p-3 rounded transition flex flex-col gap-1 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <NotificationBadge
                        action={n.badge_action as "create" | "update" | "delete" | "other"}
                        severity={n.severity}
                      />
                      <span className="truncate text-sm font-medium text-[#0d2c53] dark:text-white">
                        {n.title}
                      </span>
                    </div>
                    {n.description ? (
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                        {n.description}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Sin descripción
                      </span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {moment(n.timestamp).fromNow()}
                    </span>
                  </button>
                </li>
              );
            })
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
