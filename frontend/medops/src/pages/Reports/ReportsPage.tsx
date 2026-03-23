// src/pages/Reports/ReportsPage.tsx
import React, { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import ReportFilters from "@/components/Reports/ReportFilters";
import ReportTable from "@/components/Reports/ReportTable";
import ReportExport from "@/components/Reports/ReportExport";
import { ReportFiltersInput } from "@/types/reports";
import { useReports } from "@/hooks/reports/useReports";
import { 
  FunnelIcon, 
  TableCellsIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFiltersInput | null>(null);
  // Hook de datos con los filtros aplicados
  const { data = [], isLoading, isError, refetch } = useReports(filters);
  const handleFilter = (newFilters: ReportFiltersInput) => {
    setFilters(newFilters);
  };
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen text-white">
      
      {/* Header con Filtros Integrados */}
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "REPORTS", active: true }
        ]}
        stats={[
          { 
            label: "ENGINE_STATUS", 
            value: isLoading ? "SCANNING" : "ACTIVE", 
            color: isLoading ? "text-white animate-pulse" : "text-emerald-500" 
          },
          { 
            label: "TOTAL_RECORDS", 
            value: data.length.toString().padStart(4, '0'),
            color: "text-white"
          }
        ]}
        actions={
          <div className="flex items-center gap-4">
            {/* Barra de Filtros Compacta (Estilizada via contenedor) */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1 rounded-sm">
              <FunnelIcon className="w-4 h-4 text-[var(--palantir-active)] ml-2" />
              <ReportFilters onFilter={handleFilter} />
            </div>
            
            {/* Indicador de Protocolo */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm">
              <CpuChipIcon className="w-3.5 h-3.5 text-[var(--palantir-active)] animate-pulse" />
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--palantir-muted)]">
                v2.0.4_Secure
              </span>
            </div>
          </div>
        }
      />
      {/* Sección de Resultados y Exportación */}
      <section className="space-y-4">
        {/* Cabecera de la tabla con acciones */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <TableCellsIcon className="w-4 h-4 text-[var(--palantir-active)]" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)]">
              Data_Result_Matrix
            </h3>
          </div>
          
          <div className="flex items-center gap-3">
            {isLoading && (
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="w-3 h-3 text-[var(--palantir-active)] animate-spin" />
                <span className="text-[9px] font-mono text-[var(--palantir-active)] uppercase tracking-widest">
                  Fetching...
                </span>
              </div>
            )}
            
            {/* Botón de Refrescar */}
            <button 
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-1.5 hover:bg-white/10 rounded transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {/* Módulo de Exportación Integrado */}
            <ReportExport filters={filters} data={data} />
          </div>
        </div>
        {/* Contenedor de la Tabla */}
        <div className="min-h-[400px] bg-white/[0.02] border border-[var(--palantir-border)] rounded-sm overflow-hidden">
          {isError ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center space-y-2">
                <ShieldCheckIcon className="w-8 h-8 text-red-500/50 mx-auto" />
                <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest">
                  Critical_Query_Error
                </p>
                <button 
                  onClick={() => refetch()}
                  className="text-[9px] text-red-400 hover:text-red-300 underline"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          ) : (
            <ReportTable data={data} />
          )}
        </div>
      </section>
      {/* Footer Técnico (Opcional, reducido) */}
      <footer className="pt-4 border-t border-white/5 text-center opacity-20">
        <span className="text-[8px] font-mono uppercase tracking-[0.4em]">
          System_Analytics_Core // UID: {Math.random().toString(16).slice(2, 10).toUpperCase()}
        </span>
      </footer>
    </div>
  );
}