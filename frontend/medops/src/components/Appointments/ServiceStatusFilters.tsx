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
    <div className="flex items-center gap-1 bg-[#111] border border-white/10 p-1 rounded-sm max-w-full">
      {config.states.map((state: string) => (
        <button
          key={state}
          onClick={() => onFilterChange(state)}
          className={`
            flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-sm transition-all duration-200
            ${activeFilter === state 
              ? "bg-white/20 text-white" 
              : "text-white/80 hover:text-white hover:bg-white/10"}
          `}
        >
          <span className="text-[12px] font-semibold truncate">
            {config.labels[state as keyof typeof config.labels]}
          </span>
        </button>
      ))}
    </div>
  );
};
export default ServiceStatusFilters;