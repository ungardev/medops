// src/components/Appointments/CalendarHeader.tsx
import moment from "moment";

interface Props {
  currentMonth: moment.Moment;
  onChangeMonth: (newMonth: moment.Moment) => void;
}

export default function CalendarHeader({ currentMonth, onChangeMonth }: Props) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
      {/* Mes/Año actual */}
      <h3 className="text-base sm:text-lg font-semibold text-[#0d2c53] dark:text-gray-100 order-1 sm:order-none">
        {currentMonth.format("MMMM YYYY")}
      </h3>

      {/* Botones de navegación */}
      <div className="flex flex-wrap gap-2 order-2 sm:order-none">
        <button
          onClick={() => onChangeMonth(currentMonth.clone().subtract(1, "month"))}
          className="px-2 sm:px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                     bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                     hover:bg-gray-200 dark:hover:bg-gray-600 transition text-xs sm:text-sm"
        >
          ← Mes anterior
        </button>
        <button
          onClick={() => onChangeMonth(moment())}
          className="px-2 sm:px-3 py-1 rounded-md border border-[#0d2c53] dark:border-gray-600 
                     bg-[#0d2c53] text-white hover:bg-[#0b2444] transition text-xs sm:text-sm"
        >
          Hoy
        </button>
        <button
          onClick={() => onChangeMonth(currentMonth.clone().add(1, "month"))}
          className="px-2 sm:px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                     bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                     hover:bg-gray-200 dark:hover:bg-gray-600 transition text-xs sm:text-sm"
        >
          Mes siguiente →
        </button>
      </div>
    </div>
  );
}
