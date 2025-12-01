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
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 flex flex-col space-y-3 min-h-[320px] sm:min-h-[300px] sm:max-h-[420px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white">
          Notificaciones
        </h3>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap justify-start">
          {(["all", "info", "warning", "critical"] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-3 py-1.5 text-sm rounded border transition-colors ${
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
                className="p-4 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex justify-between items-center"
              >
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-[#0d2c53] dark:text-white flex items-center gap-1 flex-wrap leading-tight">
                    {n.entity === "Payment" && (
                      <span className="inline-block px-2 py-0.5 text-xs rounded font-semibold text-white bg-[#0d2c53]">
                        Pago
                      </span>
                    )}
                    {n.entity === "Appointment" && (
                      <span className="inline-block px-2 py-0.5 text-xs rounded font-semibold text-white bg-yellow-500">
                        Cita
                      </span>
                    )}
                    {n.entity === "WaitingRoom" && (
                      <span className="inline-block px-2 py-0.5 text-xs rounded font-semibold text-white bg-red-600">
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
                    className="px-3 py-1.5 text-xs rounded bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors"
                    onClick={() => setSelectedChargeOrder(n.entity_id)}
                  >
                    {n.action.label}
                  </button>
                ) : (
                  n.action && (
                    <Link
                      to={n.action.href}
                      className="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-[#0d2c53] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {n.action.label}
                    </Link>
                  )
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Modal */}
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
