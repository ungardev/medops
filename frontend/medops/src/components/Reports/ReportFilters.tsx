// src/components/Reports/ReportFilters.tsx
import React, { useState } from "react";
import { ReportFiltersInput, ReportType } from "@/types/reports";
import { 
  MagnifyingGlassIcon, 
  CalendarIcon // Corregido: Mayúscula y ahora sí se usará
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
    w-full bg-black/40 border border-white/10 rounded-sm pl-9 pr-3 py-2 
    text-[11px] font-mono text-white placeholder:text-white/20
    focus:outline-none focus:border-[var(--palantir-active)]/50 focus:ring-1 focus:ring-[var(--palantir-active)]/20
    transition-all hover:bg-black/60 appearance-none
  `;

  const labelStyles = `
    text-[9px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)] mb-1.5 ml-0.5
  `;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        
        {/* RANGE_START_DATE */}
        <div className="flex flex-col">
          <label className={labelStyles}>START_PERIOD</label>
          <div className="relative group">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--palantir-active)] opacity-50 group-hover:opacity-100 transition-opacity" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputStyles}
            />
          </div>
        </div>

        {/* RANGE_END_DATE */}
        <div className="flex flex-col">
          <label className={labelStyles}>TERMINUS_PERIOD</label>
          <div className="relative group">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--palantir-active)] opacity-50 group-hover:opacity-100 transition-opacity" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputStyles}
            />
          </div>
        </div>

        {/* REPORT_CLASSIFICATION */}
        <div className="flex flex-col">
          <label className={labelStyles}>CLASS_IDENTIFIER</label>
          <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--palantir-active)] opacity-50 font-mono text-[10px]">
              //
            </div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
              className={inputStyles}
            >
              <option value={ReportType.FINANCIAL}>FINANCIAL_RECORDS</option>
              <option value={ReportType.CLINICAL}>CLINICAL_HISTORY</option>
              <option value={ReportType.COMBINED}>COMBINED_AGGREGATE</option>
            </select>
          </div>
        </div>

        {/* EXECUTE_QUERY_BUTTON */}
        <button
          onClick={handleApply}
          className="group relative flex items-center justify-center gap-3 bg-[var(--palantir-active)]/10 border border-[var(--palantir-active)]/30 px-6 py-2 rounded-sm overflow-hidden transition-all hover:bg-[var(--palantir-active)]/20 active:scale-95 h-[38px]"
        >
          <MagnifyingGlassIcon className="w-4 h-4 text-[var(--palantir-active)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--palantir-active)]">
            Execute_Query
          </span>
        </button>
      </div>

      {/* FOOTER DE ESTADO */}
      <div className="flex items-center gap-4 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter">
            Filter_Buffer: Ready
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1 h-1 rounded-full ${startDate || endDate ? 'bg-blue-500 animate-pulse shadow-[0_0_5px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`} />
          <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter">
            Time_Lock: {startDate || endDate ? 'Active' : 'Global'}
          </span>
        </div>
      </div>
    </div>
  );
}
