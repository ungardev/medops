// src/components/Appointments/AppointmentFilters.tsx
import { AppointmentStatus } from "types/appointments";

interface Props {
  activeFilter: AppointmentStatus | "all";
  onFilterChange: (status: AppointmentStatus | "all") => void;
}

const FILTERS: { key: AppointmentStatus | "all"; label: string; code: string }[] = [
  { key: "all", label: "All_Records", code: "00" },
  { key: "pending", label: "Pending", code: "WL" }, // Waiting Lock
  { key: "arrived", label: "Arrived", code: "SP" }, // Subject Present
  { key: "in_consultation", label: "Consulting", code: "IP" }, // In Progress
  { key: "completed", label: "Completed", code: "OC" }, // Op Complete
  { key: "canceled", label: "Canceled", code: "TR" }, // Terminated
];

export default function AppointmentFilters({ activeFilter, onFilterChange }: Props) {
  return (
    <div className="flex flex-wrap items-center bg-black/20 border border-[var(--palantir-border)] p-1 rounded-sm gap-1">
      {/* Label de contexto para el operador */}
      <div className="hidden lg:block px-2 py-1 border-r border-[var(--palantir-border)] mr-1">
        <span className="text-[8px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">
          Filter_Stream:
        </span>
      </div>

      {FILTERS.map((f) => {
        const isActive = activeFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`
              relative flex items-center gap-2 px-3 py-1.5 transition-all duration-200
              ${isActive 
                ? "bg-[var(--palantir-active)]/10 text-[var(--palantir-active)]" 
                : "text-[var(--palantir-muted)] hover:text-[var(--palantir-text)] hover:bg-white/5"}
            `}
          >
            {/* Indicador visual de selección (barra inferior) */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--palantir-active)] shadow-[0_-2px_8px_var(--palantir-active)]" />
            )}

            <span className="text-[8px] font-mono opacity-50 group-hover:opacity-100">
              [{f.code}]
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider">
              {f.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
