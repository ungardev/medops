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
        <NoSymbolIcon className="w-10 h-10 text-white/10" />
        <p className="text-[11px] text-white/30">
          No se encontraron registros
        </p>
      </div>
    );
  }
  const getStatusConfig = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.CONFIRMED:
        return { label: "Confirmado", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
      case ReportStatus.PENDING:
        return { label: "Pendiente", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
      case ReportStatus.CANCELLED:
        return { label: "Cancelado", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" };
      default:
        return { label: "Completado", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
    }
  };
  return (
    <div className="relative border border-white/15 bg-white/5 rounded-lg overflow-hidden">
      
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="px-6 py-3 text-[9px] font-medium uppercase tracking-wider text-white/40">Fecha</th>
              <th className="px-6 py-3 text-[9px] font-medium uppercase tracking-wider text-white/40">Tipo</th>
              <th className="px-6 py-3 text-[9px] font-medium uppercase tracking-wider text-white/40">Entidad</th>
              <th className="px-6 py-3 text-[9px] font-medium uppercase tracking-wider text-white/40">Estado</th>
              <th className="px-6 py-3 text-[9px] font-medium uppercase tracking-wider text-white/40 text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row) => {
              const status = getStatusConfig(row.status);
              return (
                <tr key={row.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-[10px] text-white/40 group-hover:text-white/60 transition-colors">
                    {row.date}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-medium text-blue-400/70 uppercase tracking-wider flex items-center gap-1.5">
                      <div className="w-1 h-1 bg-blue-400/40 rounded-full" />
                      {row.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-medium text-white/70 uppercase group-hover:text-white/90">
                    {row.entity}
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-md border ${status.border} ${status.bg} ${status.color} text-[9px] font-medium tracking-wider`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${status.color.replace('text', 'bg')} mr-2`} />
                      {status.label}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-[11px] text-white/80">
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
      <div className="md:hidden divide-y divide-white/5">
        {data.map((row) => {
          const status = getStatusConfig(row.status);
          return (
            <div key={row.id} className="p-5 space-y-4 hover:bg-white/5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[9px] text-white/30 uppercase tracking-wider">{row.date}</p>
                  <h4 className="text-[11px] font-medium text-white/80 uppercase">{row.entity}</h4>
                </div>
                <div className={`px-2 py-0.5 border ${status.border} ${status.bg} ${status.color} text-[8px] font-medium tracking-wider rounded-md`}>
                  {status.label}
                </div>
              </div>
              
              <div className="flex justify-between items-end border-t border-white/5 pt-3">
                <div className="flex items-center gap-2">
                  <CircleStackIcon className="w-3.5 h-3.5 text-white/20" />
                  <span className="text-[9px] font-medium text-blue-400/60 uppercase">{row.type}</span>
                </div>
                <span className="font-medium text-[11px] text-white/80">
                  USD {row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-white/5 border-t border-white/10 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="w-4 h-4 text-white/30" />
            <div>
              <span className="text-[8px] text-white/30 uppercase block">Total General</span>
              <span className="text-[12px] font-semibold text-white/80">
                ${totals.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400/50 rounded-full" />
            <div>
              <span className="text-[8px] text-emerald-400/50 uppercase block">Confirmado</span>
              <span className="text-[12px] font-semibold text-emerald-400/80">
                ${totals.confirmed.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400/50 rounded-full" />
            <div>
              <span className="text-[8px] text-amber-400/50 uppercase block">Pendiente</span>
              <span className="text-[12px] font-semibold text-amber-400/80">
                ${totals.pending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-400/50 rounded-full" />
            <div>
              <span className="text-[8px] text-red-400/50 uppercase block">Cancelado</span>
              <span className="text-[12px] font-semibold text-red-400/80">
                ${totals.cancelled.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}