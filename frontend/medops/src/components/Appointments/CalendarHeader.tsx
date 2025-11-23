// src/components/Appointments/CalendarHeader.tsx
import moment from "moment";

interface Props {
  currentMonth: moment.Moment;
  onChangeMonth: (newMonth: moment.Moment) => void;
}

export default function CalendarHeader({ currentMonth, onChangeMonth }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      {/* Botones de navegación */}
      <div className="flex gap-2">
        <button
          onClick={() => onChangeMonth(currentMonth.clone().subtract(1, "month"))}
          className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                     bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                     hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
        >
          ← Mes anterior
        </button>
        <button
          onClick={() => onChangeMonth(moment())}
          className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                     bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
        >
          Hoy
        </button>
        <button
          onClick={() => onChangeMonth(currentMonth.clone().add(1, "month"))}
          className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                     bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                     hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
        >
          Mes siguiente →
        </button>
      </div>

      {/* Mes/Año actual */}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {currentMonth.format("MMMM YYYY")}
      </h3>
    </div>
  );
}
