import { useState } from "react";
import { useNotifications } from "@/hooks/dashboard/useNotifications";
import { NotificationEvent } from "@/types/dashboard";
import moment from "moment";
import RegisterPaymentModal from "./RegisterPaymentModal";
import { Link } from "react-router-dom";

// 🔹 Util institucional para blindar listas
function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && Array.isArray((raw as any).results)) {
    return (raw as any).results as T[];
  }
  return [];
}

export default function NotificationsFeed() {
  const { data, isLoading } = useNotifications();
  const [selectedChargeOrder, setSelectedChargeOrder] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "info" | "warning" | "critical">("all");

  const notifications = toArray<NotificationEvent>(data);
  const filtered =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.severity === filter);

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Notificaciones y eventos
        </h3>
        <div className="flex gap-2">
          {["all", "info", "warning", "critical"].map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level as any)}
              className={`px-3 py-1.5 text-sm rounded border transition-colors ${
                filter === level
                  ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
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
              className="p-4 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-between items-center"
            >
              <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  {n.entity === "Payment" && (
                    <span className="px-2 py-0.5 text-xs rounded bg-blue-600 text-white">
                      Pago
                    </span>
                  )}
                  {n.entity === "Appointment" && (
                    <span className="px-2 py-0.5 text-xs rounded bg-yellow-500 text-white">
                      Cita
                    </span>
                  )}
                  {n.entity === "WaitingRoom" && (
                    <span className="px-2 py-0.5 text-xs rounded bg-red-600 text-white">
                      Sala
                    </span>
                  )}
                  {n.message}
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {moment(n.timestamp).fromNow()}
                  {n.actor ? ` • ${n.actor}` : ""}
                </span>
              </div>

              {/* Acción dinámica */}
              {n.entity === "Payment" && n.action?.label === "Registrar Pago" ? (
                <button
                  className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 transition-colors"
                  onClick={() => setSelectedChargeOrder(n.entity_id)}
                >
                  {n.action.label}
                </button>
              ) : (
                n.action && (
                  <Link
                    to={n.action.href}
                    className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {n.action.label}
                  </Link>
                )
              )}
            </li>
          ))
        )}
      </ul>

      {/* Modal centralizado */}
      {selectedChargeOrder && (
        <RegisterPaymentModal
          chargeOrderId={selectedChargeOrder}
          onClose={() => setSelectedChargeOrder(null)}
          onSuccess={() => {
            setSelectedChargeOrder(null);
          }}
        />
      )}
    </section>
  );
}
