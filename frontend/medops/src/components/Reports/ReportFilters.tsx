// src/components/Reports/ReportFilters.tsx
import React, { useState } from "react";
import { ReportFiltersInput } from "@/types/reports";

interface Props {
  onFilter: (filters: ReportFiltersInput) => void;
}

export default function ReportFilters({ onFilter }: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<ReportFiltersInput["type"]>("financial");

  const handleApply = () => {
    onFilter({
      start_date: startDate,
      end_date: endDate,
      type,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Filtros</h3>

      {/* Fecha desde */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Desde
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                     focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Fecha hasta */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Hasta
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                     focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Tipo de reporte */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tipo de reporte
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ReportFiltersInput["type"])}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                     focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="financial">Financiero</option>
          <option value="clinical">Clínico</option>
          <option value="combined">Combinado</option>
        </select>
      </div>

      {/* Botón aplicar */}
      <div>
        <button
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
          onClick={handleApply}
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
}
