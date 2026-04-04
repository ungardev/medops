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
      const response = await apiFetch('payments/', {
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1b] border border-white/15 w-full max-w-md rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-white/5">
          <div className="flex items-center gap-3">
            <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" />
            <h2 className="text-[12px] font-semibold text-white">
              Registrar Pago en Efectivo
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {activeInstitution && (
          <div className="px-5 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <BuildingOfficeIcon className="w-4 h-4 text-white/30" />
              <span className="text-[10px] text-white/50">
                {activeInstitution.name}
              </span>
            </div>
          </div>
        )}
        
        <div className="px-6 py-4 border-b border-white/10 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Monto Requerido
            </span>
            <span className="text-2xl font-semibold text-emerald-400">
              ${expectedAmount.toFixed(2)}
            </span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-white/40 block mb-1.5">
              Monto Recibido
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-medium">$</span>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                required
                step="0.01"
                className="w-full bg-white/5 border border-white/15 p-3 pl-8 text-lg font-semibold text-emerald-400 outline-none focus:border-emerald-500/50 transition-all rounded-lg"
              />
            </div>
          </div>
          
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-medium uppercase tracking-wider text-white/30">
                Referencia
              </span>
              <span className="text-[10px] text-white/50 font-mono">
                REC-{chargeOrderId}-{new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}
              </span>
            </div>
            <p className="text-[8px] text-white/20 mt-1">
              El sistema generará una referencia única al confirmar
            </p>
          </div>
          
          <div>
            <label className="text-[10px] font-medium uppercase tracking-wider text-white/40 block mb-1.5">
              Notas
            </label>
            <textarea
              name="notes"
              value={form.notes || ''}
              onChange={handleChange}
              rows={2}
              className="w-full bg-white/5 border border-white/15 p-3 text-[11px] text-white/80 outline-none focus:border-emerald-500/50 transition-all resize-none placeholder:text-white/20 rounded-lg"
              placeholder="Notas adicionales..."
            />
          </div>
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-[10px] text-red-400">{error}</span>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-emerald-500/15 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-lg border border-emerald-500/25"
            >
              {mutation.isPending ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar Pago'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 bg-white/5 text-white/50 text-[11px] font-medium hover:bg-white/10 hover:text-white/70 transition-all rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
        
        <div className="px-6 py-3 border-t border-white/10 bg-white/5 flex items-center justify-center gap-2">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-400/30" />
          <span className="text-[8px] text-white/20 uppercase tracking-wider">
            Pago verificado en oficina
          </span>
        </div>
      </div>
    </div>
  );
}