import { useState } from "react";
import { useNotifications } from "@/hooks/dashboard/useNotifications";
import { NotificationEvent } from "@/types/dashboard";
import moment from "moment";
import RegisterPaymentModal from "./RegisterPaymentModal";
import { Link } from "react-router-dom";

export default function NotificationsFeed() {
  const { data: notifications, isLoading } = useNotifications();
  const [selectedChargeOrder, setSelectedChargeOrder] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "info" | "warning" | "critical">("all");

  if (isLoading) return <p>Cargando notificaciones...</p>;
  if (!notifications?.length) return <p>No hay notificaciones recientes.</p>;

  // 🔹 Filtrar notificaciones según severidad
  const filteredNotifications =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.severity === filter);

  return (
    <section className="dashboard-widget">
      <div className="widget-header">
        <h3>Notificaciones y eventos</h3>
        <div className="widget-actions">
          {["all", "info", "warning", "critical"].map((level) => (
            <button
              key={level}
              className={`btn ${filter === level ? "btn-primary" : "btn-outline"}`}
              onClick={() => setFilter(level as any)}
            >
              {level === "all"
                ? "Todo"
                : level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <ul className="notifications-feed">
        {filteredNotifications.map((n: NotificationEvent) => (
          <li
            key={n.id}
            className={`notification-item ${
              n.severity ? `notification-${n.severity}` : "notification-info"
            }`}
          >
            <div>
              <p className="notification-message">
                {n.entity === "Payment" && (
                  <span className="badge badge-success">Pago</span>
                )}
                {n.entity === "Appointment" && (
                  <span className="badge badge-warning">Cita</span>
                )}
                {n.entity === "WaitingRoom" && (
                  <span className="badge badge-danger">Sala</span>
                )}
                {n.message}
              </p>
              <span className="notification-timestamp">
                {moment(n.timestamp).fromNow()}
                {n.actor ? ` • ${n.actor}` : ""}
              </span>
            </div>

            {/* Acción dinámica */}
            {n.entity === "Payment" && n.action?.label === "Registrar Pago" ? (
              <button
                className="btn btn-primary text-sm"
                onClick={() => setSelectedChargeOrder(n.entity_id)}
              >
                {n.action.label}
              </button>
            ) : (
              n.action && (
                <Link to={n.action.href} className="btn btn-outline text-sm">
                  {n.action.label}
                </Link>
              )
            )}
          </li>
        ))}
      </ul>

      {/* Modal centralizado */}
      {selectedChargeOrder && (
        <RegisterPaymentModal
          chargeOrderId={selectedChargeOrder}
          onClose={() => setSelectedChargeOrder(null)}
          onSuccess={() => {
            console.log("Pago registrado en orden", selectedChargeOrder);
            setSelectedChargeOrder(null);
          }}
        />
      )}
    </section>
  );
}
