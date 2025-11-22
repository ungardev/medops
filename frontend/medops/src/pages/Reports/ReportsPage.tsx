// src/pages/Reports/ReportsPage.tsx
import React, { useState } from "react";
import ReportFilters from "@/components/Reports/ReportFilters";
import ReportTable from "@/components/Reports/ReportTable";
import ReportExport from "@/components/Reports/ReportExport";
import { ReportFiltersInput } from "@/types/reports";
import { useReports } from "@/hooks/reports/useReports";

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFiltersInput | null>(null);

  const { data = [], isLoading, isError } = useReports(filters);

  const handleFilter = (newFilters: ReportFiltersInput) => {
    setFilters(newFilters);
  };

  return (
    <main className="p-6 space-y-6">
      {/* Header institucional */}
      <header className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Reportes Institucionales
        </h2>
      </header>

      {/* Filtros */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
        <ReportFilters onFilter={handleFilter} />
      </section>

      {/* Tabla */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
        {isLoading && (
          <p className="text-sm text-gray-600 dark:text-gray-400">Cargando reportes...</p>
        )}
        {isError && (
          <p className="text-sm text-red-600 dark:text-red-400">Error cargando reportes</p>
        )}
        <ReportTable data={data} />
      </section>

      {/* Exportación */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
        <ReportExport filters={filters} data={data} />
      </section>
    </main>
  );
}
