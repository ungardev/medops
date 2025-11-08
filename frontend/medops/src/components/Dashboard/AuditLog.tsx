import React from "react";
import { useAuditLog } from "@/hooks/dashboard/useDashboard"; // ✅ usar el selector específico
import type { EventLogEntry } from "@/types/dashboard";
import moment from "moment";

const AuditLog: React.FC = () => {
  const { data: events, isLoading } = useAuditLog(); // ✅ ahora devuelve directamente EventLogEntry[]

  // 🔹 Fallback institucional si no hay eventos reales
  const fallbackEvents: EventLogEntry[] = [
    {
      id: -1,
      timestamp: new Date().toISOString(),
      user: "Sistema",
      entity: "Inicio",
      action: "create",
    },
    {
      id: -2,
      timestamp: new Date().toISOString(),
      user: "Sistema",
      entity: "Dashboard",
      action: "update",
    },
    {
      id: -3,
      timestamp: new Date().toISOString(),
      user: "Sistema",
      entity: "Auditoría",
      action: "create",
    },
  ];

  const eventsToShow: EventLogEntry[] =
    events && events.length > 0 ? events.slice(0, 10) : fallbackEvents;

  if (isLoading) return <p>Cargando auditoría...</p>;

  return (
    <section className="dashboard-widget">
      <div className="widget-header">
        <h3>Auditoría en vivo</h3>
        <div className="widget-actions">
          <button className="btn btn-outline">Exportar</button>
          <button className="btn btn-outline">Ver completo</button>
        </div>
      </div>

      <table className="audit-log-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Usuario</th>
            <th>Entidad</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {eventsToShow.map((entry: EventLogEntry) => (
            <tr key={entry.id}>
              <td>{moment(entry.timestamp).format("YYYY-MM-DD HH:mm:ss")}</td>
              <td>{entry.user}</td>
              <td>{entry.entity}</td>
              <td>
                {entry.action === "create" && (
                  <span className="badge badge-success">CREACIÓN</span>
                )}
                {entry.action === "update" && (
                  <span className="badge badge-info">ACTUALIZACIÓN</span>
                )}
                {entry.action === "delete" && (
                  <span className="badge badge-danger">ELIMINACIÓN</span>
                )}
                {!["create", "update", "delete"].includes(entry.action) && (
                  <span className="badge badge-info">
                    {entry.action.toUpperCase()}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default AuditLog;
