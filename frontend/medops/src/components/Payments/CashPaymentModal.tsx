// src/components/Payments/CashPaymentModal.tsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from '@/api/client';
import EliteModal from "../Common/EliteModal";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { 
  XMarkIcon, 
  ArrowPathIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
interface CashPaymentData {
  amount: string;
  received_by?: number;
  payment_date: string;
  notes?: string;
  cash_denominations?: Record<number, number>;
  payment_reference?: string;
}
interface Props {
  appointmentId: number;
  chargeOrderId: number;
  expectedAmount: number;
  onClose: () => void;
  open: boolean;
}
// Denominaciones venezolanas limpias y ordenadas
const VENEZUELAN_DENOMINATIONS = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];
export default function CashPaymentModal({ 
  appointmentId, 
  chargeOrderId, 
  expectedAmount, 
  onClose, 
  open 
}: Props) {
  const queryClient = useQueryClient();
  const { activeInstitution } = useInstitutions();
  
  const [form, setForm] = useState<CashPaymentData>({
    amount: expectedAmount.toFixed(2),
    payment_date: new Date().toISOString().split('T')[0],
    notes: 'Pago en efectivo',
    cash_denominations: {}
  });
  
  const mutation = useMutation({
    mutationFn: async (data: CashPaymentData) => {
      const response = await apiFetch('/api/payments/', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          charge_order: chargeOrderId,
          appointment: appointmentId,
          method: 'cash',
          status: 'confirmed',
          cash_verification: true
        })
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["charge-orders"] });
      queryClient.invalidateQueries({ queryKey: ["charge-order", String(chargeOrderId)] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      onClose();
    },
    onError: (error: any) => {
      console.error('[CASH_PAYMENT] Error:', error);
      alert('Error al procesar el pago. Por favor, intente nuevamente.');
    }
  });
  
  // Handlers corregidos con tipado adecuado
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleDenominationChange = (denomination: number, value: string) => {
    const count = parseInt(value) || 0;
    setForm((prev) => ({
      ...prev,
      cash_denominations: {
        ...(prev.cash_denominations || {}),
        [denomination]: count
      }
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.amount || parseFloat(form.amount) <= 0) {
      alert('El monto debe ser mayor a cero');
      return;
    }
    
    if (parseFloat(form.amount) !== expectedAmount) {
      alert(`El monto debe ser exactamente $${expectedAmount.toFixed(2)}`);
      return;
    }
    
    const paymentDate = new Date(form.payment_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin del día
    
    if (paymentDate > today) {
      alert('La fecha de pago no puede ser futura');
      return;
    }
    
    mutation.mutate(form);
  };
  
  const getTotalDenominations = () => {
    if (!form.cash_denominations) return 0;
    return Object.entries(form.cash_denominations).reduce((acc, [denom, count]) => {
      return acc + (parseFloat(denom) * count);
    }, 0);
  };
  
  if (!open) return null;
  return (
    <EliteModal 
      open={open} 
      onClose={onClose} 
      title="REGISTER_CASH_PAYMENT"
      maxWidth="max-w-2xl"
      showDotIndicator={true}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Header institucional */}
        {activeInstitution && (
          <div className="bg-emerald-500/10 border-emerald-500/20 px-4 py-2 rounded-lg">
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-[8px] font-mono text-emerald-300 uppercase tracking-[0.2em]">
                {activeInstitution.name} // {activeInstitution.tax_id}
              </span>
            </div>
          </div>
        )}
        
        {/* Sección principal */}
        <div className="bg-emerald-500/10 border-emerald-500/20 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-6">
            <CurrencyDollarIcon className="w-8 h-8 text-emerald-400" />
            <div>
              <h3 className="text-xl font-bold text-emerald-300 uppercase tracking-[0.2em]">
                PAGO EN EFECTIVO
              </h3>
              <p className="text-sm text-emerald-400/80 mt-1">
                Monto requerido: <span className="font-bold text-emerald-400">${expectedAmount.toFixed(2)}</span>
              </p>
              <p className="text-xs text-emerald-400/60">
                Por favor, cuente el efectivo recibido antes de registrar
              </p>
            </div>
          </div>
          
          {/* Campo monto */}
          <div className="space-y-4">
            <label className="text-[9px] font-mono uppercase tracking-widest text-emerald-400/60">
              MONTO_RECIBIDO
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400/60 font-mono text-xs">Bs.</span>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                step="0.01"
                placeholder="0.00"
                className="w-full bg-black/40 border-emerald-500/20 rounded-lg py-3 pl-12 pr-4 text-lg font-bold text-emerald-400 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-500 outline-none transition-all placeholder:opacity-30"
              />
            </div>
          </div>
        </div>
        {/* Desglose de billetes */}
        <div className="space-y-4">
          <label className="text-[9px] font-mono uppercase tracking-widest text-emerald-400/60">
            DESGLOSE DE BILLETES (OPCIONAL)
          </label>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {VENEZUELAN_DENOMINATIONS.map(denom => (
              <div key={denom} className="text-center">
                <div className="text-xs text-emerald-400/60 mb-2">{denom.toLocaleString()}</div>
                <input
                  type="number"
                  min="0"
                  value={form.cash_denominations?.[denom] || ''}
                  onChange={(e) => handleDenominationChange(denom, e.target.value)}
                  className="w-full bg-black/40 border-emerald-500/10 rounded px-2 py-1 text-emerald-400 text-center text-sm"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-emerald-400 text-sm">Total Desglose:</span>
            <span className="font-bold text-emerald-400">Bs. {getTotalDenominations().toFixed(2)}</span>
          </div>
        </div>
        {/* Campos adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-mono uppercase tracking-widest text-emerald-400/60">
              REFERENCIA INTERNA
            </label>
            <input
              type="text"
              name="payment_reference"
              value={form.payment_reference || ''}
              onChange={handleChange}
              placeholder="REC-001234"
              className="w-full bg-black/40 border-emerald-500/10 rounded-lg py-3 px-4 text-emerald-400 outline-none transition-all placeholder:opacity-20 text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] font-mono uppercase tracking-widest text-emerald-400/60">
              FECHA DEL PAGO
            </label>
            <input
              type="date"
              name="payment_date"
              value={form.payment_date}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full bg-black/40 border-emerald-500/10 rounded-lg py-3 px-4 text-emerald-400 outline-none transition-all text-sm"
            />
          </div>
        </div>
        {/* Notas */}
        <div className="space-y-2">
          <label className="text-[9px] font-mono uppercase tracking-widest text-emerald-400/60">
            NOTAS DEL PAGO
          </label>
          <textarea
            name="notes"
            value={form.notes || ''}
            onChange={handleChange}
            rows={3}
            className="w-full bg-black/40 border-emerald-500/10 rounded-lg py-3 px-4 text-emerald-400 outline-none transition-all placeholder:opacity-20 resize-none text-sm"
            placeholder="Notas adicionales sobre el pago en efectivo..."
          />
        </div>
        {/* Botones de acción */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={mutation.isPending}
            className={`flex-1 py-4 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              mutation.isPending 
                ? "bg-emerald-500/30 text-emerald-400/60 cursor-not-allowed" 
                : "bg-emerald-500 text-emerald-400 hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
            }`}
          >
            {mutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                PROCESANDO PAGO...
              </span>
            ) : (
              <span>CONFIRMAR_PAGO_EFECTIVO</span>
            )}
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] bg-gray-500/10 border-gray-500/20 hover:bg-gray-500/20 transition-colors text-gray-400"
          >
            CANCELAR
          </button>
        </div>
        
        {/* Footer de seguridad */}
        <div className="bg-emerald-500/10 px-6 py-3 border-t border-emerald-500/20 flex items-center justify-center gap-2 rounded-b-lg">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-400/60" />
          <span className="text-[7px] font-mono text-emerald-400/60 uppercase tracking-[0.3em]">
            EFECTIVO_VERIFIED_IN_OFFICE // SECURED_TRANSACTION
          </span>
        </div>
      </form>
    </EliteModal>
  );
}