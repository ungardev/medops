// src/components/Appointments/AppointmentFilters.tsx
import { AppointmentStatus } from "types/appointments";

interface Props {
  activeFilter: AppointmentStatus | "all";
  onFilterChange: (status: AppointmentStatus | "all") => void;
}

const FILTERS: { key: AppointmentStatus | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Pendientes" },
  { key: "arrived", label: "Llegados" },
  { key: "in_consultation", label: "En consulta" },
  { key: "completed", label: "Completadas" },
  { key: "canceled", label: "Canceladas" },
];

export default function AppointmentFilters({ activeFilter, onFilterChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {FILTERS.map((f) => {
        const isActive = activeFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition ${
              isActive
                ? "bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444]"
                : "border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
