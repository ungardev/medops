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
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
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
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/5 border border-white/15 p-1.5 rounded-lg">
              <FunnelIcon className="w-4 h-4 text-emerald-400 ml-2" />
              <ReportFilters onFilter={handleFilter} />
            </div>
            
            <button 
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'text-white/40'}`} />
            </button>
            
            <ReportExport filters={filters} data={data} />
          </div>
        }
      />
      
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableCellsIcon className="w-5 h-5 text-white/30" />
            <h3 className="text-[11px] font-medium text-white/60">
              Resultados
            </h3>
          </div>
        </div>
        
        <div className="min-h-[400px] bg-white/5 border border-white/15 rounded-lg overflow-hidden">
          {isError ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center space-y-3">
                <ShieldCheckIcon className="w-8 h-8 text-red-400/40 mx-auto" />
                <p className="text-[11px] text-red-400/70">
                  Error al cargar los datos
                </p>
                <button 
                  onClick={() => refetch()}
                  className="text-[10px] text-red-400/60 hover:text-red-400 underline"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <ReportTable data={data} />
          )}
        </div>
      </section>
    </div>
  );
}