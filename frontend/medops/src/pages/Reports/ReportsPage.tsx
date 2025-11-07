// src/pages/Reports/ReportsPage.tsx
import React, { useState } from "react";
import ReportFilters from "@/components/Reports/ReportFilters";
import ReportTable from "@/components/Reports/ReportTable";
import ReportExport from "@/components/Reports/ReportExport";
import { ReportFiltersInput } from "@/types/reports";
import { useReports } from "@/hooks/reports/useReports";

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFiltersInput | null>(null);

  // Hook React Query para consultar la API
  const { data = [], isLoading, isError } = useReports(filters);

  const handleFilter = (newFilters: ReportFiltersInput) => {
    setFilters(newFilters);
  };

  return (
    <main className="reports-page">
      <header className="page-header">
        <h2>Reportes Institucionales</h2>
      </header>

      {/* Filtros */}
      <section className="card reports-filters">
        <ReportFilters onFilter={handleFilter} />
      </section>

      {/* Tabla */}
      <section className="card">
        {isLoading && <p>Cargando reportes...</p>}
        {isError && <p className="text-danger">Error cargando reportes</p>}
        <ReportTable data={data} />
      </section>

      {/* Exportación */}
      <section className="card reports-actions">
        {/* ✅ ahora pasamos filters y data */}
        <ReportExport filters={filters} data={data} />
      </section>
    </main>
  );
}
