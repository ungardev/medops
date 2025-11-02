// src/components/Consultation/AuditLogPanel.tsx
import { useAuditLog } from "../../hooks/consultations/useAuditLog";

interface AuditLogPanelProps {
  appointmentId: number;
}

export default function AuditLogPanel({ appointmentId }: AuditLogPanelProps) {
  const { data: events, isLoading } = useAuditLog(appointmentId);

  return (
    <div className="auditlog-panel card mt-4">
      <h3 className="text-lg font-bold mb-2">Historial de auditoría</h3>

      {isLoading && <p className="text-muted">Cargando eventos...</p>}

      {!isLoading && (!events || events.length === 0) && (
        <p className="text-muted">Sin eventos registrados</p>
      )}

      <ul className="text-sm">
        {events?.map((e, idx) => (
          <li key={idx} className="border-b py-1">
            <span className="font-semibold">{e.action}</span>{" "}
            <span className="text-muted">
              por {e.actor} — {new Date(e.timestamp).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
