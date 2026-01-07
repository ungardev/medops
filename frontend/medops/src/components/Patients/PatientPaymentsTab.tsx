// src/components/Patients/PatientPaymentsTab.tsx
import { PatientTabProps } from "./types";
import { usePaymentsByPatient } from "../../hooks/patients/usePaymentsByPatient";
import { Payment } from "../../types/payments";
import { CurrencyDollarIcon, CalendarIcon, CreditCardIcon, FingerPrintIcon } from "@heroicons/react/24/outline";

export default function PatientPaymentsTab({ patient }: PatientTabProps) {
  const { data, isLoading, error } = usePaymentsByPatient(patient.id);

  const payments = data?.list ?? [];
  const totalAmount = data?.totalAmount ?? 0;
  const isEmpty = !isLoading && !error && payments.length === 0;

  if (isLoading) return (
    <div className="flex items-center gap-3 p-6 text-[10px] font-mono text-[var(--palantir-muted)] uppercase animate-pulse">
      <div className="w-2 h-2 bg-[var(--palantir-active)] rounded-full" />
      Querying_Financial_Records...
    </div>
  );

  if (error) return (
    <div className="p-4 border border-red-500/30 bg-red-500/10 text-red-500 text-[10px] font-mono uppercase">
      Connection_Error: {(error as Error).message}
    </div>
  );

  if (isEmpty) return (
    <div className="p-8 border border-dashed border-[var(--palantir-border)] rounded-sm text-center">
      <p className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
        Zero_Balance_History_Detected
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 📊 Resumen Financiero Estilizado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--palantir-active)]/5 border border-[var(--palantir-active)]/20 p-4 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter">Total_Revenue_Accumulated</p>
            <p className="text-2xl font-black text-[var(--palantir-active)] font-mono">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <CurrencyDollarIcon className="w-10 h-10 text-[var(--palantir-active)] opacity-20" />
        </div>
        
        <div className="bg-[var(--palantir-surface)] border border-[var(--palantir-border)] p-4 rounded-sm flex items-center justify-between">
          <div>
            <p className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter">Transaction_Count</p>
            <p className="text-2xl font-black text-[var(--palantir-text)] font-mono">
              {payments.length.toString().padStart(2, '0')}
            </p>
          </div>
          <FingerPrintIcon className="w-10 h-10 text-[var(--palantir-muted)] opacity-20" />
        </div>
      </div>

      {/* 🖥️ Desktop View: Ledger Table */}
      <div className="hidden sm:block overflow-hidden border border-[var(--palantir-border)] rounded-sm bg-[var(--palantir-bg)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--palantir-surface)] border-b border-[var(--palantir-border)]">
              <th className="px-4 py-3 text-[9px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">Received_At</th>
              <th className="px-4 py-3 text-[9px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">Transaction_ID</th>
              <th className="px-4 py-3 text-[9px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">Method</th>
              <th className="px-4 py-3 text-[9px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">Amount</th>
              <th className="px-4 py-3 text-[9px] font-black text-[var(--palantir-muted)] uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--palantir-border)] font-mono">
            {payments.map((p: Payment) => (
              <tr key={p.id} className="hover:bg-[var(--palantir-active)]/5 transition-colors">
                <td className="px-4 py-3 text-[11px] text-[var(--palantir-text)]">
                  {p.received_at ? new Date(p.received_at).toLocaleDateString("es-VE") : "---"}
                </td>
                <td className="px-4 py-3 text-[10px] text-[var(--palantir-muted)]">
                  TXN_{p.id.toString().padStart(6, '0')}
                </td>
                <td className="px-4 py-3 text-[11px] uppercase text-[var(--palantir-text)]">
                  {p.method}
                </td>
                <td className="px-4 py-3 text-[12px] font-bold text-[var(--palantir-active)]">
                  ${Number(p.amount).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📱 Mobile View: Data Cards */}
      <div className="sm:hidden space-y-3 font-mono">
        {payments.map((p: Payment) => (
          <div key={p.id} className="p-4 bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] text-[var(--palantir-muted)] uppercase">TXN_{p.id}</p>
                <p className="text-[14px] font-bold text-[var(--palantir-active)]">${p.amount}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--palantir-border)]">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-3 h-3 text-[var(--palantir-muted)]" />
                <span className="text-[10px] text-[var(--palantir-text)]">
                  {p.received_at ? new Date(p.received_at).toLocaleDateString("es-VE") : "---"}
                </span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <CreditCardIcon className="w-3 h-3 text-[var(--palantir-muted)]" />
                <span className="text-[10px] text-[var(--palantir-text)] uppercase">{p.method}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isCompleted = status.toLowerCase() === 'completed' || status.toLowerCase() === 'pagado';
  return (
    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-tighter border rounded-[2px] ${
      isCompleted 
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
    }`}>
      {status}
    </span>
  );
}
