// src/components/Payments/RegisterPaymentModal.tsx
import { useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PaymentInput, Payment, PaymentMethod, PaymentStatus } from "../../types/payments";
import { registerPayment } from "@/api/payments";
import { useInstitutions } from "@/hooks/settings/useInstitutions"; // 🆕 IMPORTAR CONTEXTO
import { 
  XMarkIcon, 
  CreditCardIcon, 
  BanknotesIcon, 
  ArrowPathIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon // 🆕 ICONO INSTITUCIONAL
} from "@heroicons/react/24/outline";
interface Props {
  appointmentId: number;
  chargeOrderId: number;
  onClose: () => void;
}
export default function RegisterPaymentModal({ appointmentId, chargeOrderId, onClose }: Props) {
  const queryClient = useQueryClient();
  // 🆕 OBTENER CONTEXTO INSTITUCIONAL
  const { activeInstitution } = useInstitutions();
  const [form, setForm] = useState<Omit<PaymentInput, "status">>({
    charge_order: chargeOrderId,
    appointment: appointmentId,
    amount: "",
    method: PaymentMethod.CASH,
    reference_number: "",
    bank_name: "",
  });
  const mutation = useMutation<Payment, Error, PaymentInput>({
    mutationFn: async (data) => {
      // 🆕 EL CONTEXTO INSTITUCIONAL SE INFERE AUTOMÁTICAMENTE 
      // DEL HEADER X-Institution-ID QUE YA CONFIGURA useInstitutions()
      const res = await registerPayment(chargeOrderId, {
        ...data,
        status: PaymentStatus.CONFIRMED,
      });
      return res;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas con la institución activa
      queryClient.invalidateQueries({ queryKey: ["charge-orders"] });
      queryClient.invalidateQueries({ queryKey: ["charge-order", String(chargeOrderId)] });
      queryClient.invalidateQueries({ queryKey: ["charge-order-events", String(chargeOrderId)] });
      queryClient.invalidateQueries({ queryKey: ["payments"] }); // 🆕 Invalidar pagos globales
      onClose();
    },
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "method" ? (value as PaymentMethod) : value,
    }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ ...form, status: PaymentStatus.CONFIRMED });
  };
  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      {/* CONTENEDOR TÉCNICO */}
      <div className="max-w-md w-full bg-[#0c0c0c] border border-[var(--palantir-border)] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER DE OPERACIÓN */}
        <div className="bg-white/[0.03] px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[var(--palantir-active)] rounded-full animate-pulse" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--palantir-text)]">
              EXECUTE_PAYMENT_ENTRY
            </h3>
          </div>
          <button onClick={onClose} className="text-[var(--palantir-muted)] hover:text-white transition-colors">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        {/* 🆕 BADGE INSTITUCIONAL */}
        {activeInstitution && (
          <div className="bg-purple-500/5 border-b border-purple-500/10 px-4 py-2">
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-3 h-3 text-purple-400" />
              <span className="text-[8px] font-mono text-purple-300 uppercase tracking-[0.2em]">
                {activeInstitution.name} // {activeInstitution.tax_id}
              </span>
            </div>
          </div>
        )}
        {/* CUERPO DEL FORMULARIO */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* CAMPO: MONTO (Highlight) */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--palantir-muted)] flex justify-between">
              <span>Transaction_Value</span>
              <span className="opacity-40">REQUIRED</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--palantir-muted)] font-mono text-xs">$</span>
              <input
                type="number"
                name="amount"
                autoFocus
                value={form.amount}
                onChange={handleChange}
                required
                placeholder="0.00"
                className="w-full bg-black/40 border border-white/10 rounded-sm py-2.5 pl-7 pr-3 text-sm font-mono text-[var(--palantir-active)] focus:ring-1 focus:ring-[var(--palantir-active)]/30 focus:border-[var(--palantir-active)]/50 outline-none transition-all placeholder:opacity-20"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* CAMPO: MÉTODO */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--palantir-muted)]">Method_ID</label>
              <select
                name="method"
                value={form.method}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-sm py-2 px-3 text-[10px] font-mono text-white outline-none focus:border-white/20 transition-all appearance-none uppercase"
              >
                <option value={PaymentMethod.CASH}>CASH_ASSETS</option>
                <option value={PaymentMethod.CARD}>CREDIT_DEBIT</option>
                <option value={PaymentMethod.TRANSFER}>WIRE_TRANSFER</option>
                <option value={PaymentMethod.OTHER}>OTHER_ENTRY</option>
              </select>
            </div>
            {/* CAMPO: REFERENCIA */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--palantir-muted)]">Reference_Log</label>
              <input
                type="text"
                name="reference_number"
                value={form.reference_number}
                onChange={handleChange}
                placeholder="N/A"
                className="w-full bg-black/40 border border-white/10 rounded-sm py-2 px-3 text-[10px] font-mono text-white focus:border-white/30 outline-none transition-all placeholder:opacity-10"
              />
            </div>
          </div>
          {/* CAMPO: BANCO */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono uppercase tracking-widest text-[var(--palantir-muted)]">Financial_Entity_Name</label>
            <input
              type="text"
              name="bank_name"
              value={form.bank_name}
              onChange={handleChange}
              placeholder="GLOBAL_CORE_BANKING"
              className="w-full bg-black/40 border border-white/10 rounded-sm py-2 px-3 text-[10px] font-mono text-white focus:border-white/30 outline-none transition-all placeholder:opacity-10"
            />
          </div>
          {/* FOOTER ACTIONS */}
          <div className="pt-4 flex flex-col gap-3">
            <button
              type="submit"
              disabled={mutation.isPending}
              className={`
                w-full py-2.5 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all
                ${mutation.isPending 
                  ? "bg-white/5 text-[var(--palantir-muted)] cursor-not-allowed" 
                  : "bg-[var(--palantir-active)] text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"}
              `}
            >
              {mutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <ArrowPathIcon className="w-3 h-3 animate-spin" />
                  Synchronizing...
                </span>
              ) : "Commit_Transaction"}
            </button>
           
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-[9px] font-mono uppercase tracking-widest text-[var(--palantir-muted)] hover:text-white transition-colors"
            >
              [ Abort_Process ]
            </button>
          </div>
        </form>
        {/* SECURITY FOOTER */}
        <div className="bg-white/[0.02] px-6 py-2 border-t border-white/5 flex items-center justify-center gap-2">
          <ShieldCheckIcon className="w-3 h-3 text-[var(--palantir-muted)] opacity-30" />
          <span className="text-[7px] font-mono text-[var(--palantir-muted)] opacity-30 uppercase tracking-[0.3em]">
            End-to-End_Encryption_Active // TLS_1.3 // Institution_Context_Active
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}