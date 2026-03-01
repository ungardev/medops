// src/components/Reports/ReportTable.tsx
import React, { useMemo } from "react";
import { ReportRow, ReportStatus, ReportType } from "@/types/reports";
import { 
  NoSymbolIcon, 
  CircleStackIcon, 
  ArrowUpRightIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
interface Props {
  data: ReportRow[];
}
export default function ReportTable({ data }: Props) {
  // ✅ CALCULAR TOTALES
  const totals = useMemo(() => {
    const confirmed = data.filter(r => r.status === ReportStatus.CONFIRMED).reduce((sum, r) => sum + (r.amount || 0), 0);
    const pending = data.filter(r => r.status === ReportStatus.PENDING).reduce((sum, r) => sum + (r.amount || 0), 0);
    const cancelled = data.filter(r => r.status === ReportStatus.CANCELLED).reduce((sum, r) => sum + (r.amount || 0), 0);
    const total = data.reduce((sum, r) => sum + (r.amount || 0), 0);
    return { confirmed, pending, cancelled, total };
  }, [data]);
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 space-y-4">
        <NoSymbolIcon className="w-10 h-10 text-[var(--palantir-muted)] opacity-20" />
        <p className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-[0.3em] animate-pulse">
          No_Dataset_Records_Found
        </p>
      </div>
    );
  }
  // Helper para centralizar la lógica de estilos de estado estilo terminal
  const getStatusConfig = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.CONFIRMED:
        return { label: "CONFIRMED", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
      case ReportStatus.PENDING:
        return { label: "PENDING", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" };
      case ReportStatus.CANCELLED:
        return { label: "CANCELLED", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" };
      default:
        return { label: "COMPLETED", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    }
  };
  return (
    <div className="relative border border-white/5 bg-black/20 rounded-sm">
      
      {/* 🔹 DESKTOP DATA MATRIX */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-[var(--palantir-muted)]">Timestamp</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-[var(--palantir-muted)]">Classification</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-[var(--palantir-muted)]">Subject_Entity</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-[var(--palantir-muted)]">Signal_Status</th>
              <th className="px-6 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-[var(--palantir-muted)] text-right">Value_USD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row) => {
              const status = getStatusConfig(row.status);
              return (
                <tr key={row.id} className="group hover:bg-[var(--palantir-active)]/[0.03] transition-colors">
                  <td className="px-6 py-4 font-mono text-[10px] text-[var(--palantir-muted)] group-hover:text-white transition-colors">
                    {row.date}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-bold text-blue-400/80 uppercase tracking-widest flex items-center gap-1.5">
                      <div className="w-1 h-1 bg-blue-400/40 rounded-full" />
                      {row.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-medium text-white/80 uppercase group-hover:text-white">
                    {row.entity}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-xs border ${status.border} ${status.bg} ${status.color} text-[8px] font-black tracking-widest`}>
                      <div className={`w-1 h-1 rounded-full ${status.color.replace('text', 'bg')} mr-2 animate-pulse`} />
                      {status.label}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-[11px] font-black text-white">
                    {row.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* 🔹 MOBILE DATA CARDS */}
      <div className="md:hidden divide-y divide-white/5">
        {data.map((row) => {
          const status = getStatusConfig(row.status);
          return (
            <div key={row.id} className="p-5 space-y-4 hover:bg-white/[0.02]">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">{row.date}</p>
                  <h4 className="text-[11px] font-black text-white uppercase">{row.entity}</h4>
                </div>
                <div className={`px-2 py-0.5 border ${status.border} ${status.bg} ${status.color} text-[7px] font-black tracking-widest`}>
                  {status.label}
                </div>
              </div>
              
              <div className="flex justify-between items-end border-t border-white/[0.03] pt-3">
                <div className="flex items-center gap-2">
                  <CircleStackIcon className="w-3 h-3 text-[var(--palantir-muted)]" />
                  <span className="text-[9px] font-bold text-blue-400/60 uppercase">{row.type}</span>
                </div>
                <span className="font-mono text-xs font-black text-white">
                  USD {row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {/* ✅ FOOTER CON TOTALES */}
      <div className="bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-red-500/5 border-t border-white/10 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* TOTAL GENERAL */}
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="w-4 h-4 text-white/40" />
            <div>
              <span className="text-[8px] font-mono text-white/40 uppercase block">Total_General</span>
              <span className="text-[12px] font-black text-white">
                ${totals.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          {/* CONFIRMADO */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            <div>
              <span className="text-[8px] font-mono text-emerald-400/60 uppercase block">Confirmed</span>
              <span className="text-[12px] font-black text-emerald-400">
                ${totals.confirmed.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          {/* PENDING */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <div>
              <span className="text-[8px] font-mono text-yellow-400/60 uppercase block">Pending</span>
              <span className="text-[12px] font-black text-yellow-400">
                ${totals.pending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          {/* CANCELLED */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <div>
              <span className="text-[8px] font-mono text-red-400/60 uppercase block">Cancelled</span>
              <span className="text-[12px] font-black text-red-400">
                ${totals.cancelled.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* 🔹 TABLE FOOTER DE AUDITORÍA */}
      <div className="bg-white/[0.02] border-t border-white/5 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4 text-[8px] font-mono text-[var(--palantir-muted)] uppercase">
          <span className="flex items-center gap-1"><ArrowUpRightIcon className="w-2 h-2" /> Data_Feed_Integrity: 100%</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline">Buffer_Encryption: AES_256</span>
        </div>
        <div className="text-[8px] font-mono text-[var(--palantir-active)]/50 uppercase italic">
          [ End_Of_Matrix ]
        </div>
      </div>
    </div>
  );
}