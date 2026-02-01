// src/components/Payments/RegisterPaymentModal.tsx
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PaymentInput, Payment, PaymentMethod, PaymentStatus } from "../../types/payments";
import { registerPayment } from "@/api/payments";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import EliteModal from "../Common/EliteModal";
import { 
  XMarkIcon, 
  ArrowPathIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";
interface Props {
  appointmentId: number;
  chargeOrderId: number;
  onClose: () => void;
  open: boolean;
}
export default function RegisterPaymentModal({ appointmentId, chargeOrderId, onClose, open }: Props) {
  const queryClient = useQueryClient();
  // Obtener contexto institucional
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
      // El contexto institucional se infiere automáticamente del Header X-Institution-ID
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
      queryClient.invalidateQueries({ queryKey: ["payments"] });
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
  return (
    <EliteModal 
      open={open} 
      onClose={onClose} 
      title="EXECUTE_PAYMENT_ENTRY"
      maxWidth="max-w-md"
      showDotIndicator={true}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Badge institucional con estilo elite */}
        {activeInstitution && (
          <div className="bg-white/5 border-b border-white/10 px-4 py-2">
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-3 h-3 text-white/60" />
              <span className="text-[8px] font-mono text-white/60 uppercase tracking-[0.2em]">
                {activeInstitution.name} // {activeInstitution.tax_id}
              </span>
            </div>
          </div>
        )}
        
        {/* Campo monto con estilo elite */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-mono uppercase tracking-widest text-white/40 flex justify-between">
            <span>Transaction_Value</span>
            <span className="opacity-40">REQUIRED</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-mono text-xs">$</span>
            <input
              type="number"
              name="amount"
              autoFocus
              value={form.amount}
              onChange={handleChange}
              required
              placeholder="0.00"
              className="w-full bg-black/40 border border-white/10 rounded-sm py-2.5 pl-7 pr-3 text-sm font-mono text-white focus:ring-1 focus:ring-white/30 focus:border-white/50 outline-none transition-all placeholder:opacity-20"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Campo método */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono uppercase tracking-widest text-white/40">Method_ID</label>
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
          
          {/* Campo referencia */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono uppercase tracking-widest text-white/40">Reference_Log</label>
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
        
        {/* Campo banco */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-mono uppercase tracking-widest text-white/40">Financial_Entity_Name</label>
          <input
            type="text"
            name="bank_name"
            value={form.bank_name}
            onChange={handleChange}
            placeholder="GLOBAL_CORE_BANKING"
            className="w-full bg-black/40 border border-white/10 rounded-sm py-2 px-3 text-[10px] font-mono text-white focus:border-white/30 outline-none transition-all placeholder:opacity-10"
          />
        </div>
        
        {/* Footer actions */}
        <div className="pt-4 flex flex-col gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className={`w-full py-2.5 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              mutation.isPending 
                ? "bg-white/5 text-white/40 cursor-not-allowed" 
                : "bg-white text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
            }`}
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
            className="w-full py-2 text-[9px] font-mono uppercase tracking-widest text-white/40 hover:text-white transition-colors"
          >
            [ Abort_Process ]
          </button>
        </div>
        
        {/* Security footer */}
        <div className="bg-white/5 px-6 py-2 border-t border-white/10 flex items-center justify-center gap-2">
          <ShieldCheckIcon className="w-3 h-3 text-white/40" />
          <span className="text-[7px] font-mono text-white/40 uppercase tracking-[0.3em]">
            End-to-End_Encryption_Active // TLS_1.3 // Institution_Context_Active
          </span>
        </div>
      </form>
    </EliteModal>
  );
}