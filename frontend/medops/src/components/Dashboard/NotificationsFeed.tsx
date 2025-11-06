import { useNotifications } from "@/hooks/dashboard/useNotifications";
import { NotificationEvent } from "@/types/dashboard";
import moment from "moment";
import { Link } from "react-router-dom";

export default function NotificationsFeed() {
  const { data: notifications, isLoading } = useNotifications();

  if (isLoading) return <p>Cargando notificaciones...</p>;
  if (!notifications?.length) return <p>No hay notificaciones recientes.</p>;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Notificaciones</h2>
      <ul className="flex flex-col gap-3">
        {notifications.map((n: NotificationEvent) => (
          <li
            key={n.id}
            className={`p-3 rounded border flex justify-between items-center ${
              n.severity === "success"
                ? "border-green-500 bg-green-50"
                : n.severity === "warning"
                ? "border-yellow-500 bg-yellow-50"
                : n.severity === "critical"
                ? "border-red-500 bg-red-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <div>
              <p className="font-medium">{n.message}</p>
              <span className="text-sm text-muted">
                {moment(n.timestamp).fromNow()}
              </span>
            </div>
            {n.action && (
              <Link to={n.action.href} className="btn btn-outline text-sm">
                {n.action.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
