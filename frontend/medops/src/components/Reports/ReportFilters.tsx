// src/components/Reports/ReportFilters.tsx
import React, { useState } from "react";
import { ReportFiltersInput, ReportType } from "@/types/reports";
import { 
  MagnifyingGlassIcon, 
  CalendarIcon
} from "@heroicons/react/24/outline";

interface Props {
  onFilter: (filters: ReportFiltersInput) => void;
}

export default function ReportFilters({ onFilter }: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<ReportType>(ReportType.FINANCIAL);

  const handleApply = () => {
    const filters: ReportFiltersInput = {
      start_date: startDate.trim() !== "" ? startDate : undefined,
      end_date: endDate.trim() !== "" ? endDate : undefined,
      type,
    };
    onFilter(filters);
  };

  const inputStyles = `
    w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-3 
    text-sm text-white/80 placeholder:text-white/30
    focus:outline-none focus:border-emerald-500/50
    transition-all hover:bg-white/10 appearance-none
  `;

  const labelStyles = `
    text-xs font-medium text-white/40 uppercase tracking-wider mb-2
  `;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
        
        <div className="flex flex-col">
          <label className={labelStyles}>Fecha Inicio</label>
          <div className="relative group">
            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/50 group-hover:text-emerald-400 transition-colors" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputStyles}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className={labelStyles}>Fecha Fin</label>
          <div className="relative group">
            <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/50 group-hover:text-emerald-400 transition-colors" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputStyles}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className={labelStyles}>Tipo de Reporte</label>
          <div className="relative group">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
              className={inputStyles}
            >
              <option value={ReportType.FINANCIAL}>Financiero</option>
              <option value={ReportType.CLINICAL}>Historial Clínico</option>
              <option value={ReportType.COMBINED}>Combinado</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleApply}
          className="group relative flex items-center justify-center gap-2 bg-emerald-500/15 border border-emerald-500/25 px-5 py-3 rounded-xl overflow-hidden transition-all hover:bg-emerald-500/25 active:scale-95 h-[48px]"
        >
          <MagnifyingGlassIcon className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">
            Aplicar
          </span>
        </button>
      </div>

      <div className="flex items-center gap-5 pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-400/50 rounded-full" />
          <span className="text-xs text-white/30">
            Filtros listos
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${startDate || endDate ? 'bg-blue-400/50' : 'bg-white/10'}`} />
          <span className="text-xs text-white/30">
            {startDate || endDate ? 'Período seleccionado' : 'Sin filtro de fecha'}
          </span>
        </div>
      </div>
    </div>
  );
}