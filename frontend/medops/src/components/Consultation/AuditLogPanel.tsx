// src/components/Consultation/AuditLogPanel.tsx
import { useAuditLog } from "../../hooks/consultations/useAuditLog";

interface AuditLogPanelProps {
  appointmentId: number;
}

export default function AuditLogPanel({ appointmentId }: AuditLogPanelProps) {
  const { data: events, isLoading } = useAuditLog(appointmentId);

  return (
    <div className="auditlog-panel card mt-4 rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white mb-2">
        Historial de auditoría
      </h3>

      {isLoading && (
        <p className="text-sm text-gray-600 dark:text-gray-400">Cargando eventos...</p>
      )}

      {!isLoading && (!events || events.length === 0) && (
        <p className="text-sm text-gray-600 dark:text-gray-400">Sin eventos registrados</p>
      )}

      <ul className="text-sm">
        {events?.map((e, idx) => (
          <li
            key={idx}
            className="border-b border-gray-200 dark:border-gray-700 py-1 flex justify-between"
          >
            <span className="font-semibold text-[#0d2c53] dark:text-white">{e.action}</span>
            <span className="text-gray-600 dark:text-gray-400">
              por {e.actor} — {new Date(e.timestamp).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
