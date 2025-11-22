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
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => {
        const isActive = activeFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition ${
              isActive
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
