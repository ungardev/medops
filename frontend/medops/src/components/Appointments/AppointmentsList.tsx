// src/components/Appointments/AppointmentsList.tsx
import { useState } from "react";
import { Appointment, AppointmentStatus } from "types/appointments";
import { 
  XMarkIcon, 
  EyeIcon, 
  TrashIcon, 
  ClockIcon, 
  EllipsisVerticalIcon 
} from "@heroicons/react/24/outline";

interface AppointmentsListProps {
  appointments: Appointment[];
  onEdit: (a: Appointment) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: AppointmentStatus) => void;
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: "WAITING_LOCK", bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500" },
  arrived: { label: "SUBJECT_PRESENT", bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  in_consultation: { label: "IN_PROGRESS", bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-400" },
  completed: { label: "OP_COMPLETE", bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500" },
  canceled: { label: "TERMINATED", bg: "bg-red-500/10", text: "text-red-500", dot: "bg-red-500" },
};

export default function AppointmentsList({
  appointments,
  onEdit,
  onDelete,
  onStatusChange,
}: AppointmentsListProps) {
  // Estado para rastrear qué menú está abierto
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  return (
    <div className="overflow-visible border border-[var(--palantir-border)] rounded-sm bg-[var(--palantir-bg)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 border-b border-[var(--palantir-border)]">
              <th className="px-4 py-3 text-[10px] font-black text-[var(--palantir-muted)] uppercase tracking-[0.2em]">Subject_Identity</th>
              <th className="px-4 py-3 text-[10px] font-black text-[var(--palantir-muted)] uppercase tracking-[0.2em]">Timestamp</th>
              <th className="px-4 py-3 text-[10px] font-black text-[var(--palantir-muted)] uppercase tracking-[0.2em]">Module_Type</th>
              <th className="px-4 py-3 text-[10px] font-black text-[var(--palantir-muted)] uppercase tracking-[0.2em]">Status_Code</th>
              <th className="px-4 py-3 text-[10px] font-black text-[var(--palantir-muted)] uppercase tracking-[0.2em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--palantir-border)]/50">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest animate-pulse">
                    No_Data_Segments_Found_In_Registry
                  </p>
                </td>
              </tr>
            ) : (
              appointments.map((a) => {
                const config = STATUS_CONFIG[a.status];
                const isMenuOpen = openMenuId === a.id;

                return (
                  <tr 
                    key={a.id} 
                    className="group hover:bg-[var(--palantir-active)]/5 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 italic">
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-[var(--palantir-text)] uppercase group-hover:text-[var(--palantir-active)]">
                          {a.patient?.full_name || "UNKNOWN_SUBJECT"}
                        </span>
                        <span className="text-[9px] font-mono text-[var(--palantir-muted)]">
                          REF_ID: {a.patient?.id?.toString().padStart(5, '0')}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--palantir-text)]">
                        <ClockIcon className="w-3.5 h-3.5 text-[var(--palantir-active)]" />
                        {a.appointment_date}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-[10px] font-mono text-[var(--palantir-muted)] uppercase">
                      {a.appointment_type}
                    </td>

                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-sm border ${config.bg} border-current/20`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                        <span className={`text-[9px] font-black tracking-tighter ${config.text}`}>
                          {config.label}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right relative">
                      <div className="flex justify-end relative">
                        <button
                          onClick={() => setOpenMenuId(isMenuOpen ? null : a.id)}
                          onBlur={() => setTimeout(() => setOpenMenuId(null), 200)}
                          className="p-1.5 rounded-sm hover:bg-[var(--palantir-active)]/20 text-[var(--palantir-muted)] transition-all"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>

                        {/* Dropdown Menu Táctico */}
                        {isMenuOpen && (
                          <div className="absolute right-0 mt-8 w-48 bg-[var(--palantir-bg)] border border-[var(--palantir-border)] shadow-2xl z-[60] py-1 animate-in fade-in zoom-in duration-100">
                            <button
                              onClick={() => onEdit(a)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--palantir-text)] hover:bg-[var(--palantir-active)] hover:text-white transition-colors border-b border-[var(--palantir-border)]/30"
                            >
                              <EyeIcon className="h-3.5 w-3.5" /> Inspect_Record
                            </button>
                            
                            {a.status !== "canceled" && (
                              <button
                                onClick={() => onStatusChange(a.id, "canceled")}
                                className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-colors border-b border-[var(--palantir-border)]/30"
                              >
                                <XMarkIcon className="h-3.5 w-3.5" /> Abort_Mission
                              </button>
                            )}

                            <button
                              onClick={() => onDelete(a.id)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-600 hover:text-white transition-colors"
                            >
                              <TrashIcon className="h-3.5 w-3.5" /> Purge_System
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
