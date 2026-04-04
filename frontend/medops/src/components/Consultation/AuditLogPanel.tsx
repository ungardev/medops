// src/components/Consultation/AuditLogPanel.tsx
import { useAuditLog } from "../../hooks/consultations/useAuditLog";
interface AuditLogPanelProps {
  appointmentId: number;
}
export default function AuditLogPanel({ appointmentId }: AuditLogPanelProps) {
  const { data: events, isLoading } = useAuditLog(appointmentId);
  return (
    <div className="mt-4 p-5 bg-white/5 border border-white/15 rounded-lg">
      <h3 className="text-[12px] font-semibold text-white mb-3">
        Historial de Auditoría
      </h3>
      {isLoading && (
        <p className="text-[11px] text-white/50">Cargando eventos...</p>
      )}
      {!isLoading && (!events || events.length === 0) && (
        <p className="text-[11px] text-white/50">Sin eventos registrados</p>
      )}
      <ul className="space-y-2">
        {events?.map((e, idx) => (
          <li
            key={idx}
            className="border-b border-white/10 py-2 flex justify-between items-center"
          >
            <span className="text-[11px] font-medium text-white">{e.action}</span>
            <span className="text-[10px] text-white/50">
              por {e.actor} — {new Date(e.timestamp).toLocaleString("es-VE")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}