// src/components/Appointments/AppointmentFilters.tsx
import { AppointmentStatus } from "types/appointments";
import { 
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ClipboardIcon,
  XCircleIcon 
} from "@heroicons/react/24/outline";
interface Props {
  activeFilter: AppointmentStatus | "all";
  onFilterChange: (status: AppointmentStatus | "all") => void;
}
const FILTERS: { 
  key: AppointmentStatus | "all"; 
  label: string; 
  code: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { key: "all", label: "Todas", code: "00", icon: <FunnelIcon className="w-4 h-4" />, color: "text-white/80" },
  { key: "pending", label: "Pendientes", code: "WL", icon: <ClockIcon className="w-4 h-4" />, color: "text-yellow-400" },
  { key: "arrived", label: "Llegaron", code: "SP", icon: <UserGroupIcon className="w-4 h-4" />, color: "text-green-400" },
  { key: "in_consultation", label: "En Consulta", code: "IP", icon: <ClipboardIcon className="w-4 h-4" />, color: "text-purple-400" },
  { key: "completed", label: "Completadas", code: "OC", icon: <CheckCircleIcon className="w-4 h-4" />, color: "text-gray-300" },
  { key: "canceled", label: "Canceladas", code: "TR", icon: <XCircleIcon className="w-4 h-4" />, color: "text-red-400" },
];
export default function AppointmentFilters({ activeFilter, onFilterChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-[#111] border border-white/10 p-1 rounded-sm w-full">
      {FILTERS.map((f) => {
        const isActive = activeFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`
              flex-1 min-w-0 flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm transition-all duration-200
              ${isActive 
                ? "bg-white/20 text-white" 
                : "text-white/60 hover:text-white hover:bg-white/10"}
            `}
          >
            <div className={f.color}>{f.icon}</div>
            <span className="text-[10px] font-semibold truncate">
              {f.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}