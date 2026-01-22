// src/components/Payments/PaymentList.tsx
import React from "react";
import { Payment, PaymentStatus, PaymentMethod } from "../../types/payments";
import { formatCurrency } from "@/utils/format";  // ✅ AGREGADO: Import de formatCurrency
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon, 
  NoSymbolIcon 
} from "@heroicons/react/24/outline";
interface Props {
  payments: Payment[];
  hideSummaryBadges?: boolean;
}
export default function PaymentList({ payments, hideSummaryBadges = false }: Props) {
  if (!payments || payments.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed border-white/10 rounded-sm">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--palantir-muted)]">
          Zero_Transaction_History_Detected
        </span>
      </div>
    );
  }
  const totals = payments.reduce(
    (acc, p) => {
      const amt = parseFloat(String(p.amount) || "0");
      acc.total += isNaN(amt) ? 0 : amt;
      switch (p.status) {
        case PaymentStatus.CONFIRMED: acc.confirmed += amt; break;
        case PaymentStatus.PENDING: acc.pending += amt; break;
        case PaymentStatus.REJECTED:
        case PaymentStatus.VOID: acc.failed += amt; break;
      }
      return acc;
    },
    { total: 0, confirmed: 0, pending: 0, failed: 0 }
  );
  return (
    <div className="space-y-4">
      {/* 📊 MINI SUMMARY PANEL (TERMINAL STYLE) */}
      {!hideSummaryBadges && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: "SUM_TOTAL", val: totals.total, color: "text-white bg-white/5" },
            { label: "SUM_CONFIRMED", val: totals.confirmed, color: "text-emerald-400 bg-emerald-500/10" },
            { label: "SUM_PENDING", val: totals.pending, color: "text-yellow-500 bg-yellow-500/10" },
            { label: "SUM_FAILED", val: totals.failed, color: "text-red-400 bg-red-500/10" }
          ].map((stat, i) => (
            <div key={i} className={`px-2 py-1 border border-white/5 rounded-sm flex items-center gap-2 `}>
              <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">{stat.label}:</span>
              <span className="text-[10px] font-mono font-bold">{formatCurrency(stat.val, undefined)}</span>  {/* ✅ CORREGIDO: Ahora muestra el valor con formatCurrency */}
            </div>
          ))}
        </div>
      )}
      {/* 🧾 TRANSACTION LOG TABLE */}
      <div className="overflow-x-auto border border-white/5 bg-black/40 rounded-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--palantir-muted)]">Amt_Credit</th>
              <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--palantir-muted)]">Method_Type</th>
              <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--palantir-muted)]">Status_Flag</th>
              <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--palantir-muted)]">Reference_Log</th>
              <th className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--palantir-muted)]">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {payments.map((p) => {
              const amount = parseFloat(String(p.amount) || "0");
              const dateStr = p.received_at ?? p.appointment_date;
              const date = dateStr ? new Date(dateStr).toLocaleDateString('en-GB') : "---";
              
              // Map de Configuración de Estatus
              const statusMap = {
                [PaymentStatus.CONFIRMED]: { label: "CONFIRMED", icon: CheckCircleIcon, color: "text-emerald-400" },
                [PaymentStatus.PENDING]: { label: "PENDING", icon: ClockIcon, color: "text-yellow-500" },
                [PaymentStatus.REJECTED]: { label: "REJECTED", icon: XCircleIcon, color: "text-red-400" },
                [PaymentStatus.VOID]: { label: "VOID", icon: NoSymbolIcon, color: "text-gray-500" },
              };
              const config = statusMap[p.status as keyof typeof statusMap] || statusMap[PaymentStatus.PENDING];
              const StatusIcon = config.icon;
              return (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2 font-mono text-[11px] font-bold text-white">
                    {formatCurrency(p.amount, p.currency)}  {/* ✅ CORREGIDO: Ahora muestra el monto con formatCurrency */}
                  </td>
                  <td className="px-4 py-2 text-[10px] uppercase font-mono tracking-tighter text-[var(--palantir-muted)]">
                    {p.method === PaymentMethod.CASH ? "Cash_Assets" : 
                     p.method === PaymentMethod.CARD ? "Card_Debit" : 
                     p.method === PaymentMethod.TRANSFER ? "Wire_Transfer" : "Other_Entry"}
                  </td>
                  <td className="px-4 py-2">
                    <div className={`flex items-center gap-2 `}>
                      <StatusIcon className="w-3 h-3" />
                      <span className="text-[9px] font-black tracking-widest uppercase">{config.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 font-mono text-[9px] text-[var(--palantir-active)]/70">
                    {p.reference_number || "SYS_GEN_NULL"}
                  </td>
                  <td className="px-4 py-2 font-mono text-[9px] text-[var(--palantir-muted)]">
                    {date}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}