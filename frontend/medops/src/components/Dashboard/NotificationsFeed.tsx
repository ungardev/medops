import { useState } from "react";
import { useNotifications } from "@/hooks/dashboard/useNotifications";
import { NotificationEvent } from "@/types/dashboard";
import moment from "moment";
import RegisterPaymentModal from "./RegisterPaymentModal";
import { Link } from "react-router-dom";

export default function NotificationsFeed() {
  const { data: notifications, isLoading } = useNotifications();
  const [selectedChargeOrder, setSelectedChargeOrder] = useState<number | null>(null);

  if (isLoading) return <p>Cargando notificaciones...</p>;
  if (!notifications?.length) return <p>No hay notificaciones recientes.</p>;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Notificaciones</h2>
      <ul className="notifications-feed">
        {notifications.map((n: NotificationEvent) => (
          <li
            key={n.id}
            className={`notification-item ${
              n.severity === "success"
                ? "notification-success"
                : n.severity === "warning"
                ? "notification-warning"
                : n.severity === "critical"
                ? "notification-critical"
                : "notification-info"
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
    </div>
  );
}
