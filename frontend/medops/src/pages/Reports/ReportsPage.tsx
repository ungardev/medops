// src/pages/Reports/ReportsPage.tsx
import React, { useState } from "react";
import ReportFilters from "@/components/Reports/ReportFilters";
import ReportTable from "@/components/Reports/ReportTable";
import ReportExport from "@/components/Reports/ReportExport";
import { ReportFiltersInput, ExportFormat } from "@/types/reports";
import { useReports } from "@/hooks/reports/useReports";

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFiltersInput | null>(null);

  // Hook React Query para consultar la API
  const { data = [], isLoading, isError } = useReports(filters);

  const handleFilter = (newFilters: ReportFiltersInput) => {
    setFilters(newFilters);
  };

  const handleExport = (format: ExportFormat) => {
    console.log(`Exportando reporte en formato ${format}`, { filters, data });
    // Aquí luego añadiremos lógica real de exportación
  };

  return (
    <main className="container">
      <header className="header">
        <h2>Reportes Institucionales</h2>
      </header>

      {/* Filtros */}
      <section className="card">
        <ReportFilters onFilter={handleFilter} />
      </section>

      {/* Tabla */}
      <section className="card">
        {isLoading && <p>Cargando reportes...</p>}
        {isError && <p className="text-danger">Error cargando reportes</p>}
        <ReportTable data={data} />
      </section>

      {/* Exportación */}
      <section className="card">
        <ReportExport onExport={handleExport} />
      </section>
    </main>
  );
}
