import React, { useState } from "react";
import { ReportFiltersInput, ReportType } from "@/types/reports";

interface Props {
  onFilter: (filters: ReportFiltersInput) => void;
}

export default function ReportFilters({ onFilter }: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<ReportType>(ReportType.FINANCIAL);

  const handleApply = () => {
    onFilter({
      start_date: startDate,
      end_date: endDate,
      type,
    });
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-gray-100 mb-4">
        Filtros
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-end sm:gap-4 space-y-4 sm:space-y-0">
        {/* Fecha desde */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1">
            Desde
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />
        </div>

        {/* Fecha hasta */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1">
            Hasta
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          />
        </div>

        {/* Tipo de reporte */}
        <div className="flex flex-col">
          <label className="text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1">
            Tipo de reporte
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ReportType)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                       bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                       focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
          >
            <option value={ReportType.FINANCIAL}>Financiero</option>
            <option value={ReportType.CLINICAL}>Clínico</option>
            <option value={ReportType.COMBINED}>Combinado</option>
          </select>
        </div>

        {/* Botón aplicar */}
        <div className="flex flex-col">
          <button
            className="w-full px-4 py-2 rounded-md bg-[#0d2c53] text-white hover:bg-[#0b2444] transition text-sm"
            onClick={handleApply}
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
}
