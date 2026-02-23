// src/components/Payments/CashPaymentModal.tsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from '@/api/client';
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { 
  XMarkIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
interface CashPaymentData {
  amount: string;
  received_by?: number;
  payment_date: string;
  notes?: string;
}
interface Props {
  appointmentId: number;
  chargeOrderId: number;
  expectedAmount: number;
  onClose: () => void;
  open: boolean;
}
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
    notes: ''
  });
  
  const [error, setError] = useState<string | null>(null);
  
  const mutation = useMutation({
    mutationFn: async (data: CashPaymentData) => {
      const response = await apiFetch('/api/payments/', {
        method: 'POST',
        body: JSON.stringify({
          amount: data.amount,
          method: 'cash',
          charge_order: chargeOrderId,
          appointment: appointmentId,
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
      setError(error.message || 'Error al procesar el pago');
    }
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('El monto debe ser mayor a cero');
      return;
    }
    
    if (parseFloat(form.amount) !== expectedAmount) {
      setError(`El monto debe ser exactamente $${expectedAmount.toFixed(2)}`);
      return;
    }
    
    mutation.mutate(form);
  };
  
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0b] border border-white/10 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
              Register_Cash_Payment
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        
        {/* Institution Badge */}
        {activeInstitution && (
          <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-3 h-3 text-purple-400" />
              <span className="text-[8px] font-mono text-purple-300 uppercase tracking-[0.2em]">
                {activeInstitution.name} // {activeInstitution.tax_id}
              </span>
            </div>
          </div>
        )}
        
        {/* Amount Display */}
        <div className="p-4 border-b border-white/5 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
              Monto_Requerido
            </span>
            <span className="text-2xl font-black text-emerald-400">
              ${expectedAmount.toFixed(2)}
            </span>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Amount Input */}
          <div>
            <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">
              Monto_Recibido
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-mono text-sm">$</span>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                step="0.01"
                className="w-full bg-black/40 border border-white/10 p-3 pl-8 text-lg font-black text-emerald-400 outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>
          
          {/* Reference Info - Autogenerada */}
          <div className="p-3 bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/40">
                Referencia_Autogenerada
              </span>
              <span className="text-[10px] font-mono text-white/60">
                REC-{chargeOrderId}-{new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}
              </span>
            </div>
            <p className="text-[7px] text-white/30 mt-1">
              El sistema generará una referencia única al confirmar
            </p>
          </div>
          
          {/* Notes */}
          <div>
            <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">
              Notas
            </label>
            <textarea
              name="notes"
              value={form.notes || ''}
              onChange={handleChange}
              rows={2}
              className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white outline-none focus:border-emerald-500/50 transition-all resize-none placeholder:text-white/20"
              placeholder="Notas adicionales..."
            />
          </div>
          
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-[10px] text-red-300">{error}</span>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar_Pago'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-6 bg-white/5 text-white/50 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
        
        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/5 flex items-center justify-center gap-2">
          <ShieldCheckIcon className="w-3 h-3 text-emerald-400/40" />
          <span className="text-[7px] font-mono text-white/30 uppercase tracking-[0.3em]">
            Cash_Verified_In_Office // Ref_Autogenerated
          </span>
        </div>
      </div>
    </div>
  );
}