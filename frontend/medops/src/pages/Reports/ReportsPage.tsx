// src/pages/Reports/ReportsPage.tsx
import React, { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import ReportFilters from "@/components/Reports/ReportFilters";
import ReportTable from "@/components/Reports/ReportTable";
import ReportExport from "@/components/Reports/ReportExport";
import { ReportFiltersInput } from "@/types/reports";
import { useReports } from "@/hooks/reports/useReports";
import { 
  ChartBarIcon, 
  FunnelIcon, 
  TableCellsIcon,
  CpuChipIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFiltersInput | null>(null);

  // Hook de datos con los filtros aplicados
  const { data = [], isLoading, isError } = useReports(filters);

  const handleFilter = (newFilters: ReportFiltersInput) => {
    setFilters(newFilters);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-[var(--palantir-bg)] min-h-screen text-[var(--palantir-text)]">
      
      {/* 📡 CABECERA DE OPERACIONES ANALÍTICAS - CORREGIDA */}
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPS", path: "/" },
          { label: "ANALYTICS", path: "/analytics" },
          { label: "DATA_MINING", active: true }
        ]}
        stats={[
          { 
            label: "ENGINE_STATUS", 
            value: "ACTIVE", 
            color: "text-emerald-500" 
          },
          { 
            label: "TOTAL_RECORDS", 
            value: data.length.toString().padStart(4, '0'),
            color: "text-white"
          }
        ]}
        actions={
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-sm">
            <CpuChipIcon className="w-3.5 h-3.5 text-[var(--palantir-active)] animate-pulse" />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--palantir-muted)]">
              Protocol: v2.0.4_Secure
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-8 max-w-7xl mx-auto">
        
        {/* 🛠️ SECCIÓN 01: PARAMETRIZACIÓN (FILTROS) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <FunnelIcon className="w-4 h-4 text-[var(--palantir-active)]" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)]">
              Query_Parameters
            </h3>
          </div>
          <div className="bg-white/[0.02] border border-[var(--palantir-border)] p-5 sm:p-7 rounded-sm backdrop-blur-md relative overflow-hidden group">
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
              <ChartBarIcon className="w-32 h-32 -mr-10 -mt-10 rotate-12" />
            </div>
            
            <ReportFilters onFilter={handleFilter} />
          </div>
        </section>

        {/* 📊 SECCIÓN 02: RESULTADOS (MATRIZ DE DATOS) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <TableCellsIcon className="w-4 h-4 text-[var(--palantir-active)]" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)]">
                Data_Result_Matrix
              </h3>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-[var(--palantir-active)] animate-ping rounded-full" />
                <span className="text-[9px] font-mono text-[var(--palantir-active)] uppercase tracking-widest">
                  Fetching_Dataset...
                </span>
              </div>
            )}
          </div>

          <div className="min-h-[400px]">
            {isError ? (
              <div className="h-64 flex items-center justify-center border border-red-500/20 bg-red-500/5 rounded-sm">
                <div className="text-center space-y-2">
                  <p className="text-[10px] font-mono text-red-500 uppercase tracking-widest">
                    Critical_Query_Error: Access_Denied_Or_Timeout
                  </p>
                </div>
              </div>
            ) : (
              <ReportTable data={data} />
            )}
          </div>
        </section>

        {/* 📥 SECCIÓN 03: EXPORTACIÓN (SIFÓN DE DATOS) */}
        <section className="pt-4">
          <div className="bg-gradient-to-r from-transparent via-[var(--palantir-border)]/20 to-transparent p-[1px]">
            <div className="bg-[var(--palantir-bg)] p-8 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5 shadow-2xl relative">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  <ShieldCheckIcon className="w-6 h-6 text-emerald-500/50" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                    Data_Exfiltration_Module
                  </h4>
                  <p className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase mt-1.5 leading-relaxed max-w-md">
                    Securely package the current result set into standardized document formats for external auditing.
                  </p>
                </div>
              </div>
              
              <div className="w-full md:w-auto">
                <ReportExport filters={filters} data={data} />
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* 🏁 FOOTER TÉCNICO */}
      <footer className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 opacity-20">
        <span className="text-[8px] font-mono uppercase tracking-[0.4em]">
          System_Analytics_Core // UID: {Math.random().toString(16).slice(2, 10).toUpperCase()}
        </span>
        <span className="text-[8px] font-mono uppercase tracking-[0.4em]">
          Transmission_Secure_Closed
        </span>
      </footer>
    </div>
  );
}
