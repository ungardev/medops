// src/components/Appointments/ServiceStatusFilters.tsx
import { SERVICE_STATUS_CONFIG } from '@/utils/serviceStatusConfig';
interface Props {
  categoryType: string;
  activeFilter: string;
  onFilterChange: (status: string) => void;
}
const ServiceStatusFilters = ({ categoryType, activeFilter, onFilterChange }: Props) => {
  const config = SERVICE_STATUS_CONFIG[categoryType as keyof typeof SERVICE_STATUS_CONFIG] || SERVICE_STATUS_CONFIG.APPOINTMENT;
  
  return (
    <div className="flex items-center gap-1 bg-[#111] border border-white/10 p-1 rounded-sm">
      {config.states.map((state: string) => (
        <button
          key={state}
          onClick={() => onFilterChange(state)}
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm transition-all duration-200
            ${activeFilter === state 
              ? "bg-white/15 text-white" 
              : "text-white/40 hover:text-white/70 hover:bg-white/5"}
          `}
        >
          <span className="text-[9px] font-medium">
            {config.labels[state as keyof typeof config.labels]}
          </span>
        </button>
      ))}
    </div>
  );
};
export default ServiceStatusFilters;