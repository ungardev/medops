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
  ShieldCheckIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFiltersInput | null>(null);
  const { data = [], isLoading, isError, refetch } = useReports(filters);
  
  const handleFilter = (newFilters: ReportFiltersInput) => {
    setFilters(newFilters);
  };
  
  return (
    <div className="space-y-6">
      
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/doctor" },
          { label: "Reportes", active: true }
        ]}
        stats={[
          { 
            label: "Estado", 
            value: isLoading ? "Cargando" : "Activo", 
            color: isLoading ? "text-amber-400 animate-pulse" : "text-emerald-400" 
          },
          { 
            label: "Registros", 
            value: data.length.toString(),
            color: "text-white/70"
          }
        ]}
        actions={<ReportExport filters={filters} data={data} />}
      />
      
      <section className="bg-white/5 border border-white/15 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FunnelIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-medium text-white/60">
              Filtros de Reporte
            </h3>
          </div>
          <button 
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowPathIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : 'text-white/40'}`} />
          </button>
        </div>
        <ReportFilters onFilter={handleFilter} />
      </section>
      
      <section className="min-h-[500px] bg-white/5 border border-white/15 rounded-xl overflow-hidden">
        {isError ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center space-y-5">
              <ShieldCheckIcon className="w-12 h-12 text-red-400/40 mx-auto" />
              <p className="text-sm text-red-400/70">
                Error al cargar los datos
              </p>
              <button 
                onClick={() => refetch()}
                className="px-5 py-3 bg-white/5 border border-white/15 text-white/60 text-sm font-medium hover:bg-white/10 hover:text-white rounded-xl transition-all"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <ReportTable data={data} />
        )}
      </section>
      
    </div>
  );
}