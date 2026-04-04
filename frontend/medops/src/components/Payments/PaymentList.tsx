// src/components/Payments/PaymentList.tsx
import React from "react";
import { Payment, PaymentStatus, PaymentMethod } from "../../types/payments";
import { formatCurrency } from "@/utils/format";
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
      <div className="p-6 text-center border border-dashed border-white/15 rounded-lg">
        <span className="text-[11px] text-white/30">
          Sin transacciones registradas
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
      {!hideSummaryBadges && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Total", val: totals.total, color: "text-white bg-white/5" },
            { label: "Confirmado", val: totals.confirmed, color: "text-emerald-400 bg-emerald-500/10" },
            { label: "Pendiente", val: totals.pending, color: "text-amber-400 bg-amber-500/10" },
            { label: "Fallido", val: totals.failed, color: "text-red-400 bg-red-500/10" }
          ].map((stat, i) => (
            <div key={i} className={`px-3 py-1.5 border border-white/10 rounded-lg flex items-center gap-2 ${stat.color.replace('text-', 'bg-').split(' ')[1] || 'bg-white/5'}`}>
              <span className="text-[8px] font-medium uppercase tracking-wider text-white/40">{stat.label}:</span>
              <span className="text-[10px] font-semibold">{formatCurrency(stat.val, undefined)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="overflow-x-auto border border-white/15 bg-white/5 rounded-lg">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="px-4 py-3 text-[9px] font-medium uppercase tracking-wider text-white/40">Monto</th>
              <th className="px-4 py-3 text-[9px] font-medium uppercase tracking-wider text-white/40">Método</th>
              <th className="px-4 py-3 text-[9px] font-medium uppercase tracking-wider text-white/40">Estado</th>
              <th className="px-4 py-3 text-[9px] font-medium uppercase tracking-wider text-white/40">Referencia</th>
              <th className="px-4 py-3 text-[9px] font-medium uppercase tracking-wider text-white/40">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {payments.map((p) => {
              const amount = parseFloat(String(p.amount) || "0");
              const dateStr = p.received_at ?? p.appointment_date;
              const date = dateStr ? new Date(dateStr).toLocaleDateString('es-VE') : "—";
              
              const statusMap = {
                [PaymentStatus.CONFIRMED]: { label: "Confirmado", icon: CheckCircleIcon, color: "text-emerald-400" },
                [PaymentStatus.PENDING]: { label: "Pendiente", icon: ClockIcon, color: "text-amber-400" },
                [PaymentStatus.REJECTED]: { label: "Rechazado", icon: XCircleIcon, color: "text-red-400" },
                [PaymentStatus.VOID]: { label: "Anulado", icon: NoSymbolIcon, color: "text-white/30" },
              };
              const config = statusMap[p.status as keyof typeof statusMap] || statusMap[PaymentStatus.PENDING];
              const StatusIcon = config.icon;
              const methodLabels: Record<string, string> = {
                [PaymentMethod.CASH]: "Efectivo",
                [PaymentMethod.CARD]: "Tarjeta",
                [PaymentMethod.TRANSFER]: "Transferencia",
              };
              
              return (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-[12px] text-white/80">
                    {formatCurrency(p.amount, p.currency)}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-white/50">
                    {methodLabels[p.method] || p.method}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-medium tracking-wider uppercase">{config.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-white/40">
                    {p.reference_number || "—"}
                  </td>
                  <td className="px-4 py-3 text-[10px] text-white/30">
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