// src/components/Appointments/CalendarLegend.tsx
import { AppointmentStatus } from "../../types/appointments";

const LEGEND: { key: AppointmentStatus; label: string; color: string }[] = [
  { key: "pending", label: "WAITING_LOCK", color: "bg-amber-500" },
  { key: "arrived", label: "SUBJECT_PRESENT", color: "bg-blue-400" },
  { key: "in_consultation", label: "IN_PROGRESS", color: "bg-indigo-400" },
  { key: "completed", label: "OP_COMPLETE", color: "bg-emerald-500" },
  { key: "canceled", label: "TERMINATED", color: "bg-red-500" },
];

export default function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 border-t border-[var(--palantir-border)] pt-4">
      <div className="text-[9px] font-black text-[var(--palantir-muted)] uppercase tracking-[0.2em] mr-2">
        Status_Protocols:
      </div>
      
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {LEGEND.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-2 group cursor-help"
          >
            {/* Indicador con efecto de pulso estático */}
            <div className="relative">
              <span className={`block w-2 h-2 rounded-full ${item.color} shadow-[0_0_5px_currentColor]`}></span>
              <span className={`absolute inset-0 w-2 h-2 rounded-full ${item.color} animate-ping opacity-20 group-hover:opacity-40`}></span>
            </div>
            
            <span className="text-[10px] font-mono text-[var(--palantir-text)] uppercase tracking-wider group-hover:text-[var(--palantir-active)] transition-colors">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
