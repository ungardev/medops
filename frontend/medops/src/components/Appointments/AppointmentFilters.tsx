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
    <div className="flex flex-wrap gap-2 mb-4">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onFilterChange(f.key)}
          className={`btn ${
            activeFilter === f.key ? "btn-primary" : "btn-outline"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
