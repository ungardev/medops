// src/components/Patients/PatientEventsTab.tsx
import { PatientTabProps } from "./types";
import { useEventsByPatient, PatientEvent } from "../../hooks/patients/useEventsByPatient";
import { CommandLineIcon, UserIcon, TagIcon, BoltIcon } from "@heroicons/react/24/outline";

export default function PatientEventsTab({ patient }: PatientTabProps) {
  const { data, isLoading, error } = useEventsByPatient(patient.id);

  const events = data?.list ?? [];
  const isEmpty = !isLoading && !error && events.length === 0;

  if (isLoading) return (
    <div className="flex items-center gap-3 p-6 text-[10px] font-mono text-[var(--palantir-muted)] uppercase animate-pulse">
      <div className="w-2 h-2 bg-[var(--palantir-active)] rounded-full" />
      Fetching_Audit_Logs...
    </div>
  );

  if (error) return (
    <div className="p-4 border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-mono uppercase">
      Critical_Audit_Error: {(error as Error).message}
    </div>
  );

  if (isEmpty) return (
    <div className="p-8 border border-dashed border-[var(--palantir-border)] rounded-sm text-center">
      <p className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
        No_System_Events_Found
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header Estilizado */}
      <div className="flex items-center gap-3 px-1">
        <CommandLineIcon className="w-4 h-4 text-[var(--palantir-active)]" />
        <h3 className="text-[10px] font-black text-[var(--palantir-text)] uppercase tracking-[0.2em]">
          SYSTEM_AUDIT_LOG
        </h3>
        <div className="h-[1px] flex-grow bg-gradient-to-r from-[var(--palantir-border)] to-transparent" />
      </div>

      {/* 🖥️ Desktop View */}
      <div className="hidden sm:block overflow-hidden border border-[var(--palantir-border)] rounded-sm">
        <table className="w-full text-left border-collapse font-mono">
          <thead>
            <tr className="bg-[var(--palantir-surface)] border-b border-[var(--palantir-border)]">
              <th className="px-4 py-3 text-[9px] font-black text-[var(--palantir-muted)] uppercase">Timestamp</th>
              <th className="px-4 py-3 text-[9px] font-black text-[var(--palantir-muted)] uppercase">Actor</th>
              <th className="px-4 py-3 text-[9px] font-black text-[var(--palantir-muted)] uppercase">Target_Entity</th>
              <th className="px-4 py-3 text-[9px] font-black text-[var(--palantir-muted)] uppercase">Action</th>
              <th className="px-4 py-3 text-[9px] font-black text-[var(--palantir-muted)] uppercase">Payload_Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--palantir-border)] bg-[var(--palantir-bg)]">
            {events.map((ev: PatientEvent) => (
              <tr key={ev.id} className="hover:bg-[var(--palantir-active)]/5 transition-colors group">
                <td className="px-4 py-3 text-[10px] text-[var(--palantir-text)] whitespace-nowrap italic">
                  {new Date(ev.timestamp).toLocaleString("es-VE", { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-3 text-[10px] text-[var(--palantir-active)] font-bold">
                  {ev.actor || "SYSTEM"}
                </td>
                <td className="px-4 py-3 text-[10px] text-[var(--palantir-text)]">
                  <span className="text-[var(--palantir-muted)]">{ev.entity}</span>
                  <span className="ml-2 text-[8px] bg-[var(--palantir-surface)] px-1 border border-[var(--palantir-border)]">#{ev.entity_id}</span>
                </td>
                <td className="px-4 py-3">
                  <ActionBadge action={ev.action} />
                </td>
                <td className="px-4 py-3">
                  {ev.metadata ? (
                    <details className="cursor-pointer">
                      <summary className="text-[9px] text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] uppercase tracking-tighter list-none">
                        [ VIEW_JSON ]
                      </summary>
                      <pre className="mt-2 p-2 bg-black/20 rounded text-[9px] leading-tight text-emerald-500/80 max-w-xs overflow-auto border border-white/5">
                        {JSON.stringify(ev.metadata, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-[10px] text-[var(--palantir-muted)]">---</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📱 Mobile View */}
      <div className="sm:hidden space-y-3 font-mono">
        {events.map((ev: PatientEvent) => (
          <div key={ev.id} className="p-3 bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[8px] text-[var(--palantir-muted)] italic">
                {new Date(ev.timestamp).toLocaleString("es-VE")}
              </span>
              <ActionBadge action={ev.action} />
            </div>
            
            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-2">
                <UserIcon className="w-3 h-3 text-[var(--palantir-active)]" />
                <span className="text-[10px] font-bold text-[var(--palantir-text)]">{ev.actor || "SYSTEM"}</span>
              </div>
              <div className="flex items-center gap-2">
                <TagIcon className="w-3 h-3 text-[var(--palantir-muted)]" />
                <span className="text-[10px] text-[var(--palantir-muted)] uppercase">{ev.entity} #{ev.entity_id}</span>
              </div>
            </div>

            {ev.metadata && (
              <details className="mt-2 border-t border-[var(--palantir-border)] pt-2">
                <summary className="text-[9px] text-[var(--palantir-active)] uppercase tracking-widest list-none">Metadata_Extract</summary>
                <pre className="mt-2 p-2 bg-black/40 rounded text-[8px] text-emerald-400 overflow-x-auto">
                  {JSON.stringify(ev.metadata, null, 1)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const colorMap: Record<string, string> = {
    CREATE: "border-emerald-500/50 text-emerald-500 bg-emerald-500/5",
    UPDATE: "border-blue-500/50 text-blue-500 bg-blue-500/5",
    DELETE: "border-red-500/50 text-red-500 bg-red-500/5",
    LOGIN: "border-purple-500/50 text-purple-500 bg-purple-500/5",
  };

  const style = colorMap[action.toUpperCase()] || "border-[var(--palantir-border)] text-[var(--palantir-muted)] bg-[var(--palantir-surface)]";

  return (
    <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter border rounded-[1px] ${style}`}>
      {action}
    </span>
  );
}
