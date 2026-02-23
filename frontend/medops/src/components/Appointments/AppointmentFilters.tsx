// src/components/Appointments/AppointmentFilters.tsx
import { AppointmentStatus } from "types/appointments";
interface Props {
  activeFilter: AppointmentStatus | "all";
  onFilterChange: (status: AppointmentStatus | "all") => void;
}
const FILTERS: { key: AppointmentStatus | "all"; label: string; code: string }[] = [
  { key: "all", label: "All_Records", code: "00" },
  { key: "pending", label: "Pending", code: "WL" },
  { key: "arrived", label: "Arrived", code: "SP" },
  { key: "in_consultation", label: "Consulting", code: "IP" },
  { key: "completed", label: "Completed", code: "OC" },
  { key: "canceled", label: "Canceled", code: "TR" },
];
export default function AppointmentFilters({ activeFilter, onFilterChange }: Props) {
  return (
    <div className="flex flex-wrap items-center bg-black/20 border border-white/10 p-1 gap-1">
      <div className="hidden lg:block px-2 py-1 border-r border-white/10 mr-1">
        <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
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
                ? "text-white bg-white/10" 
                : "text-white/30 hover:text-white/70 hover:bg-white/5"}
            `}
          >
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/30" />
            )}
            <span className="text-[8px] font-mono opacity-50">
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