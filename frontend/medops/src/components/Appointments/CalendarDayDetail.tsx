// src/components/Appointments/CalendarDayDetail.tsx
import moment from "moment";
import { Appointment } from "../../types/appointments";
import { XMarkIcon, CalendarIcon } from "@heroicons/react/24/outline";

interface Props {
  date: Date;
  appointments: Appointment[];
  onClose: () => void;
  onSelectAppointment: (appt: Appointment) => void;
}

export default function CalendarDayDetail({ date, appointments, onClose, onSelectAppointment }: Props) {
  const dayAppointments = appointments.filter((appt) =>
    moment(appt.appointment_date, "YYYY-MM-DD").isSame(date, "day")
  );

  const handleClickAppointment = (appt: Appointment) => {
    onClose();
    onSelectAppointment(appt);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      pending: { label: "WAITING_LOCK", color: "text-amber-500 border-amber-500/30 bg-amber-500/5" },
      arrived: { label: "SUBJECT_PRESENT", color: "text-blue-400 border-blue-400/30 bg-blue-400/5" },
      in_consultation: { label: "IN_PROGRESS", color: "text-indigo-400 border-indigo-400/30 bg-indigo-400/5" },
      completed: { label: "OP_COMPLETE", color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/5" },
      canceled: { label: "TERMINATED", color: "text-red-500 border-red-500/30 bg-red-500/5" },
    };
    return configs[status] || { label: "UNKNOWN", color: "text-gray-400 border-gray-400/30" };
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 px-4">
      <div className="bg-[var(--palantir-bg)] border border-[var(--palantir-border)] w-full max-w-2xl shadow-2xl overflow-hidden">
        
        {/* Header de Operaciones Diarias */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--palantir-border)] bg-black/40">
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex p-2 border border-[var(--palantir-active)]/30 text-[var(--palantir-active)]">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-[var(--palantir-active)] uppercase tracking-[0.3em]">
                Temporal_Sub_Inspector
              </span>
              <h2 className="text-lg font-black text-[var(--palantir-text)] uppercase tracking-tight">
                Log_Entries: <span className="text-[var(--palantir-muted)] font-mono">{moment(date).format("DD_MMM_YYYY").toUpperCase()}</span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="group flex items-center gap-2 px-3 py-1 border border-[var(--palantir-border)] hover:border-red-500/50 transition-all"
          >
            <span className="text-[10px] font-bold text-[var(--palantir-muted)] group-hover:text-red-500 uppercase tracking-widest">Close_View</span>
            <XMarkIcon className="w-4 h-4 text-[var(--palantir-muted)] group-hover:text-red-500" />
          </button>
        </div>

        {/* Listado de Protocolos */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {dayAppointments.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center border border-dashed border-[var(--palantir-border)] bg-black/10">
              <span className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase animate-pulse">
                -- No_Active_Deployments_Detected --
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              {dayAppointments.map((appt) => {
                const status = getStatusConfig(appt.status);
                return (
                  <div
                    key={appt.id}
                    onClick={() => handleClickAppointment(appt)}
                    className="group relative flex items-center justify-between p-4 bg-black/20 border border-[var(--palantir-border)] hover:border-[var(--palantir-active)] transition-all cursor-pointer overflow-hidden"
                  >
                    {/* Indicador de Hover Lateral */}
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--palantir-active)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono text-[var(--palantir-active)] bg-[var(--palantir-active)]/10 px-1.5 py-0.5 border border-[var(--palantir-active)]/20">
                          {moment(appt.appointment_date).format("HH:mm")}
                        </span>
                        <h3 className="text-sm font-black text-[var(--palantir-text)] uppercase tracking-wide group-hover:text-[var(--palantir-active)] transition-colors">
                          {appt.patient.full_name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 border ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
                          Type: {appt.appointment_type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[8px] font-bold text-[var(--palantir-muted)] uppercase tracking-tighter">Reference_Hash</span>
                        <span className="text-[10px] font-mono text-[var(--palantir-text)]">#{appt.id.toString().padStart(5, '0')}</span>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-[var(--palantir-active)] animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Informativo */}
        <div className="px-6 py-3 bg-black/60 border-t border-[var(--palantir-border)] flex justify-between items-center">
          <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-[0.2em]">
            System_Inspector_v2.0.4 // Active_Monitor
          </span>
          <span className="text-[8px] font-mono text-[var(--palantir-muted)]">
            TOTAL_ENTRIES: {dayAppointments.length.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}
