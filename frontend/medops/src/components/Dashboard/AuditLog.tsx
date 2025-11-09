import React from "react";
import { useAuditLogDirect } from "@/hooks/dashboard/useDashboard"; // ✅ usar el nuevo hook
import type { EventLogEntry } from "@/types/dashboard";
import moment from "moment";

const AuditLog: React.FC = () => {
  const { data: events, isLoading } = useAuditLogDirect(10); // ✅ ahora consume el endpoint real

  if (isLoading) return <p>Cargando auditoría...</p>;
  if (!events || events.length === 0) return <p>No hay eventos registrados.</p>;

  // 🔹 Helper para badge de severidad
  const severityBadge = (severity?: string | null) => {
    switch (severity) {
      case "critical":
        return <span className="badge badge-danger">CRÍTICO</span>;
      case "warning":
        return <span className="badge badge-warning">ADVERTENCIA</span>;
      case "success":
        return <span className="badge badge-success">ÉXITO</span>;
      default:
        return <span className="badge badge-info">INFO</span>;
    }
  };

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
            <th>Severidad</th>
          </tr>
        </thead>
        <tbody>
          {events.slice(0, 10).map((entry: EventLogEntry) => (
            <tr key={entry.id}>
              <td>{moment(entry.timestamp).format("YYYY-MM-DD HH:mm:ss")}</td>
              <td>{entry.actor}</td>
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
                  <span className="badge badge-secondary">
                    {entry.action.toUpperCase()}
                  </span>
                )}
              </td>
              <td>{severityBadge(entry.severity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
};

export default AuditLog;
