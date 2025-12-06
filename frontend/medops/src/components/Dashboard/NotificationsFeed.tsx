// src/components/NotificationsFeed.tsx
import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/dashboard/useNotifications";
import { NotificationEvent } from "@/types/dashboard";
import moment from "moment";
import RegisterPaymentModal from "./RegisterPaymentModal";
import AppointmentDetail from "@/components/Appointments/AppointmentDetail";
import { useAppointment } from "@/hooks/appointments/useAppointments";
import { Link } from "react-router-dom";
import { EyeIcon } from "@heroicons/react/24/outline";

// 🔹 Util institucional para blindar listas
function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && Array.isArray((raw as any).results)) {
    return (raw as any).results as T[];
  }
  return [];
}

// 🔹 Wrapper para cargar cita antes de mostrar AppointmentDetail
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
        <p className="bg-white dark:bg-gray-800 p-4 rounded shadow text-sm text-[#0d2c53] dark:text-gray-200">
          Cargando cita...
        </p>
      </div>
    );
  }

  if (isError || !appointment) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <p className="bg-white dark:bg-gray-800 p-4 rounded shadow text-sm text-red-600 dark:text-red-400">
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

  return (
    <AppointmentDetail
      appointment={appointment}
      onClose={onClose}
      onEdit={(appt) => {
        console.log("Editar cita", appt);
        onClose();
      }}
    />
  );
}
export default function NotificationsFeed() {
  const { data, isLoading, refetch } = useNotifications();
  const [selectedChargeOrder, setSelectedChargeOrder] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "info" | "warning" | "critical">("all");

  // 🔹 Fuerza refetch al montar para evitar fallback fantasma
  useEffect(() => {
    const timeout = setTimeout(() => {
      refetch();
    }, 500); // medio segundo para que el backend esté listo
    return () => clearTimeout(timeout);
  }, [refetch]);

  const notifications = toArray<NotificationEvent>(data);
  const filtered =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.severity === filter);

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 flex flex-col space-y-3 min-h-[320px] sm:min-h-[300px] sm:max-h-[420px]">
      {/* Header */}
      <div className="flex flex-col md:space-y-2 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white text-center md:text-center lg:text-left mb-2 md:mb-0">
          Notificaciones
        </h3>

        {/* Botonera */}
        <div className="grid grid-cols-4 gap-2 w-full lg:flex lg:justify-end lg:gap-2 mt-2 md:mt-0">
          {(["all", "info", "warning", "critical"] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`w-full px-2 py-1.5 text-[11px] sm:text-xs rounded border transition-colors whitespace-nowrap ${
                filter === level
                  ? "bg-[#0d2c53] text-white border-[#0d2c53] hover:bg-[#0b2444] hover:text-white dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-200 dark:hover:text-black"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              {level === "all"
                ? "Todo"
                : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="min-w-0">
        <ul className="space-y-3">
          {isLoading ? (
            <li className="text-sm text-gray-500 dark:text-gray-400">
              Cargando notificaciones...
            </li>
          ) : filtered.length === 0 ? (
            <li className="text-sm text-gray-500 dark:text-gray-400">
              No hay notificaciones recientes.
            </li>
          ) : (
            filtered.map((n: NotificationEvent) => (
              <li
                key={n.id}
                className="p-4 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-between items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="min-w-0 text-sm font-medium text-[#0d2c53] dark:text-white flex items-center gap-2 leading-tight">
                    {n.entity === "Payment" && (
                      <span className="inline-flex flex-none px-2 py-[2px] text-[11px] rounded font-semibold text-white text-center bg-[#0d2c53] leading-none">
                        Pago
                      </span>
                    )}
                    {n.entity === "Appointment" && (
                      <span className="inline-flex flex-none px-2 py-[2px] text-[11px] rounded font-semibold text-white text-center bg-yellow-500 leading-none">
                        Cita
                      </span>
                    )}
                    {n.entity === "WaitingRoom" && (
                      <span className="inline-flex flex-none px-2 py-[2px] text-[11px] rounded font-semibold text-white text-center bg-red-600 leading-none">
                        Sala
                      </span>
                    )}
                    <span className="min-w-0 max-w-full truncate">{n.message}</span>
                  </p>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 min-w-0 truncate">
                    {moment(n.timestamp).fromNow()}
                    {n.actor ? ` • ${n.actor}` : ""}
                  </span>
                </div>

                {/* Acción */}
                {n.entity === "WaitingRoom" ? (
                  <Link
                    to="/waitingroom"
                    className="inline-flex items-center justify-center w-8 h-8 rounded border border-red-600 text-red-600 hover:bg-gray-50 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors flex-none"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Link>
                ) : n.entity === "Appointment" ? (
                  <button
                    className="inline-flex items-center justify-center w-8 h-8 rounded border border-yellow-500 text-yellow-600 hover:bg-gray-50 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors flex-none"
                    onClick={() => setSelectedAppointmentId(n.entity_id)}
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                ) : n.entity === "Payment" && n.action?.label === "Registrar Pago" ? (
                  <button
                    className="inline-flex items-center justify-center w-8 h-8 rounded border border-[#0d2c53] text-[#0d2c53] hover:bg-gray-50 dark:border-gray-500 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors flex-none"
                    onClick={() => setSelectedChargeOrder(n.entity_id)}
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                ) : (
                  n.action && (
                    <Link
                      to={n.action.href}
                      className="inline-flex items-center justify-center w-8 h-8 rounded border border-gray-300 dark:border-gray-600 text-[#0d2c53] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-none"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Link>
                  )
                )}
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
