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
  { key: "all", label: "Todas", code: "00", icon: <FunnelIcon className="w-3 h-3" />, color: "text-white/60" },
  { key: "pending", label: "Pendientes", code: "WL", icon: <ClockIcon className="w-3 h-3" />, color: "text-yellow-500" },
  { key: "arrived", label: "Llegaron", code: "SP", icon: <UserGroupIcon className="w-3 h-3" />, color: "text-green-500" },
  { key: "in_consultation", label: "En Consulta", code: "IP", icon: <ClipboardIcon className="w-3 h-3" />, color: "text-purple-500" },
  { key: "completed", label: "Completadas", code: "OC", icon: <CheckCircleIcon className="w-3 h-3" />, color: "text-gray-500" },
  { key: "canceled", label: "Canceladas", code: "TR", icon: <XCircleIcon className="w-3 h-3" />, color: "text-red-500" },
];
export default function AppointmentFilters({ activeFilter, onFilterChange }: Props) {
  return (
    <div className="flex items-center gap-1 bg-[#111] border border-white/10 p-1 rounded-sm">
      {FILTERS.map((f) => {
        const isActive = activeFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm transition-all duration-200
              ${isActive 
                ? "bg-white/15 text-white" 
                : "text-white/40 hover:text-white/70 hover:bg-white/5"}
            `}
          >
            <div className={f.color}>{f.icon}</div>
            <span className="text-[9px] font-medium">
              {f.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}