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
    <div className="flex items-center gap-3 p-6 text-[11px] text-white/40 animate-pulse">
      <div className="w-2 h-2 bg-emerald-400 rounded-full" />
      Cargando historial de pagos...
    </div>
  );
  if (error) return (
    <div className="p-4 border border-red-500/20 bg-red-500/5 text-red-400 text-[11px] rounded-lg">
      Error de conexión: {(error as Error).message}
    </div>
  );
  if (isEmpty) return (
    <div className="p-8 border border-dashed border-white/15 rounded-lg text-center">
      <p className="text-[11px] text-white/40">
        No hay historial de pagos registrado
      </p>
    </div>
  );
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Total Acumulado</p>
            <p className="text-2xl font-semibold text-emerald-400 mt-1">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <CurrencyDollarIcon className="w-10 h-10 text-emerald-400 opacity-20" />
        </div>
        
        <div className="bg-white/5 border border-white/15 p-5 rounded-lg flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Transacciones</p>
            <p className="text-2xl font-semibold text-white mt-1">
              {payments.length}
            </p>
          </div>
          <FingerPrintIcon className="w-10 h-10 text-white/20 opacity-20" />
        </div>
      </div>
      <div className="hidden sm:block overflow-hidden border border-white/15 rounded-lg bg-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/15">
              <th className="px-4 py-3 text-[10px] font-medium text-white/50 uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-3 text-[10px] font-medium text-white/50 uppercase tracking-wider">ID Transacción</th>
              <th className="px-4 py-3 text-[10px] font-medium text-white/50 uppercase tracking-wider">Método</th>
              <th className="px-4 py-3 text-[10px] font-medium text-white/50 uppercase tracking-wider">Monto</th>
              <th className="px-4 py-3 text-[10px] font-medium text-white/50 uppercase tracking-wider text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {payments.map((p: Payment) => (
              <tr key={p.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-[11px] text-white/70">
                  {p.received_at ? new Date(p.received_at).toLocaleDateString("es-VE") : "—"}
                </td>
                <td className="px-4 py-3 text-[10px] text-white/40">
                  #{p.id.toString().padStart(6, '0')}
                </td>
                <td className="px-4 py-3 text-[11px] text-white/70">
                  {p.method === 'cash' ? 'Efectivo' : p.method === 'transfer' ? 'Transferencia' : p.method === 'card' ? 'Tarjeta' : p.method === 'zelle' ? 'Zelle' : p.method === 'crypto' ? 'Cripto' : p.method}
                </td>
                <td className="px-4 py-3 text-[12px] font-semibold text-emerald-400">
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
      <div className="sm:hidden space-y-3">
        {payments.map((p: Payment) => (
          <div key={p.id} className="p-4 bg-white/5 border border-white/15 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] text-white/40">#{p.id.toString().padStart(6, '0')}</p>
                <p className="text-[16px] font-semibold text-emerald-400 mt-0.5">${Number(p.amount).toFixed(2)}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-3.5 h-3.5 text-white/30" />
                <span className="text-[10px] text-white/60">
                  {p.received_at ? new Date(p.received_at).toLocaleDateString("es-VE") : "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <CreditCardIcon className="w-3.5 h-3.5 text-white/30" />
                <span className="text-[10px] text-white/60">
                  {p.method === 'cash' ? 'Efectivo' : p.method === 'transfer' ? 'Transferencia' : p.method === 'card' ? 'Tarjeta' : p.method === 'zelle' ? 'Zelle' : p.method === 'crypto' ? 'Cripto' : p.method}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function StatusBadge({ status }: { status: string }) {
  const isCompleted = status.toLowerCase() === 'confirmed' || status.toLowerCase() === 'completed' || status.toLowerCase() === 'pagado';
  return (
    <span className={`px-2.5 py-1 text-[9px] font-medium uppercase border rounded-md ${
      isCompleted 
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    }`}>
      {isCompleted ? 'Confirmado' : status}
    </span>
  );
}