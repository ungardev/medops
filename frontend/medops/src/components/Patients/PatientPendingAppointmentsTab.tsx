// src/components/Patients/PatientPendingAppointmentsTab.tsx
import { PatientTabProps } from "./types";
import { usePendingAppointments } from "../../hooks/patients/usePendingAppointments";
import { Appointment } from "../../types/appointments";
import { CalendarDaysIcon, ClockIcon, ChatBubbleBottomCenterTextIcon } from "@heroicons/react/24/outline";

export default function PatientPendingAppointmentsTab({ patient }: PatientTabProps) {
  const { data: appointments, isLoading, error } = usePendingAppointments(patient.id);

  const isEmpty = !isLoading && !error && (appointments?.length ?? 0) === 0;

  if (isLoading) return (
    <div className="flex items-center gap-3 p-6 text-[10px] font-mono text-[var(--palantir-muted)] uppercase animate-pulse">
      <div className="w-2 h-2 bg-[var(--palantir-active)] rounded-full" />
      Syncing_Future_Schedule...
    </div>
  );

  if (error) return (
    <div className="p-4 border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-mono uppercase">
      Schedule_Access_Denied: {(error as Error).message}
    </div>
  );

  if (isEmpty) return (
    <div className="p-8 border border-dashed border-[var(--palantir-border)] rounded-sm text-center">
      <p className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
        No_Active_Appointments_In_Queue
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <CalendarDaysIcon className="w-4 h-4 text-[var(--palantir-active)]" />
          <h3 className="text-[10px] font-black text-[var(--palantir-text)] uppercase tracking-[0.2em]">
            UPCOMING_SCHEDULED_EVENTS
          </h3>
        </div>
        <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase">
          Total_Pending: {appointments?.length.toString().padStart(2, '0')}
        </span>
      </div>

      <div className="hidden sm:block overflow-hidden border border-[var(--palantir-border)] rounded-sm bg-[var(--palantir-bg)]">
        <table className="w-full text-left border-collapse font-mono">
          <thead>
            <tr className="bg-[var(--palantir-surface)] border-b border-[var(--palantir-border)]">
              <th className="px-4 py-3 text-[9px] font-black text-[var(--palantir-muted)] uppercase">Target_Date</th>
              <th className="px-4 py-3 text-[9px] font-black text-[var(--palantir-muted)] uppercase">Type</th>
              <th className="px-4 py-3 text-[9px] font-black text-[var(--palantir-muted)] uppercase">Status</th>
              <th className="px-4 py-3 text-[9px] font-black text-[var(--palantir-muted)] uppercase">Operational_Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--palantir-border)]">
            {appointments?.map((a: Appointment) => {
              // ✅ Ajustado a tus tipos reales:
              // Consideramos "Activa/Verde" si ya llegó (arrived) o está en consulta.
              // "Pendiente/Amarilla" si es 'pending'.
              const isActive = a.status === 'arrived' || a.status === 'in_consultation';
              
              return (
                <tr key={a.id} className="hover:bg-[var(--palantir-active)]/5 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-[var(--palantir-text)] uppercase">
                        {new Date(a.appointment_date).toLocaleDateString("es-VE")}
                      </span>
                      <span className="text-[9px] text-[var(--palantir-muted)] tracking-tighter italic">
                        {getTimeRemaining(a.appointment_date)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] bg-[var(--palantir-active)]/10 text-[var(--palantir-active)] px-2 py-0.5 border border-[var(--palantir-active)]/20 uppercase font-black">
                      {a.appointment_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isActive ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                      <span className="text-[10px] text-[var(--palantir-text)] uppercase italic">{a.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[10px] text-[var(--palantir-muted)] max-w-xs truncate group-hover:whitespace-normal">
                      {a.notes || "No_Telemetry_Data"}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista Mobile */}
      <div className="sm:hidden space-y-3 font-mono">
        {appointments?.map((a: Appointment) => (
          <div key={a.id} className="p-4 bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <ClockIcon className="w-8 h-8 text-[var(--palantir-active)]" />
            </div>
            <div className="mb-3">
              <p className="text-[9px] text-[var(--palantir-muted)] uppercase tracking-tighter">Event_ID: APPT_{a.id}</p>
              <p className="text-[14px] font-black text-[var(--palantir-text)] uppercase">
                {new Date(a.appointment_date).toLocaleDateString("es-VE")}
              </p>
              <p className="text-[8px] text-[var(--palantir-active)] uppercase italic">
                {getTimeRemaining(a.appointment_date)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-[var(--palantir-border)] pt-3">
              <div className="flex flex-col">
                <span className="text-[8px] text-[var(--palantir-muted)] uppercase">Type</span>
                <span className="text-[10px] text-[var(--palantir-text)] uppercase font-bold">{a.appointment_type}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[8px] text-[var(--palantir-muted)] uppercase">Status</span>
                <span className="text-[10px] text-[var(--palantir-active)] uppercase font-bold">{a.status}</span>
              </div>
            </div>
            {a.notes && (
              <div className="mt-3 p-2 bg-black/10 rounded-sm flex gap-2">
                <ChatBubbleBottomCenterTextIcon className="w-3 h-3 text-[var(--palantir-muted)] flex-shrink-0" />
                <p className="text-[9px] text-[var(--palantir-muted)] italic leading-tight">{a.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getTimeRemaining(dateString: string): string {
  const target = new Date(dateString);
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "DUE_TODAY";
  if (diffDays < 0) return "OVERDUE";
  return `T_MINUS_${diffDays}_DAYS`;
}
