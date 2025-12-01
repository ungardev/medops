// src/components/Appointments/CalendarLegend.tsx
import { AppointmentStatus } from "../../types/appointments";

const LEGEND: { key: AppointmentStatus; label: string; color: string }[] = [
  { key: "pending", label: "Pendiente", color: "bg-yellow-500" },
  { key: "arrived", label: "Llegado", color: "bg-blue-500" },
  { key: "in_consultation", label: "En consulta", color: "bg-cyan-500" },
  { key: "completed", label: "Completada", color: "bg-green-500" },
  { key: "canceled", label: "Cancelada", color: "bg-red-500" },
];

export default function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 sm:mt-4">
      {LEGEND.map((item) => (
        <div
          key={item.key}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
        >
          <span className={`w-3 h-3 sm:w-4 sm:h-4 rounded ${item.color}`}></span>
          <span className="text-[#0d2c53] dark:text-gray-300">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
