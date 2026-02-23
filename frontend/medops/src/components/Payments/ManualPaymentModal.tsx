// src/components/Payments/ManualPaymentModal.tsx
import React, { useState } from 'react';
import { 
  XMarkIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  CreditCardIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/api/client';
interface ManualPaymentModalProps {
  open: boolean;
  chargeOrderId: number;
  expectedAmount: number;
  onVerificationSuccess: (data: any) => void;
  onClose: () => void;
}
interface ManualPaymentData {
  reference_number: string;
  bank_name: string;
  amount: string;
  payment_date: string;
  notes: string;
}
interface VenezuelanBank {
  code: string;
  name: string;
  shortName: string;
}
const ManualPaymentModal: React.FC<ManualPaymentModalProps> = ({
  open,
  chargeOrderId,
  expectedAmount,
  onVerificationSuccess,
  onClose
}) => {
  const [formData, setFormData] = useState<ManualPaymentData>({
    reference_number: '',
    bank_name: '',
    amount: expectedAmount.toFixed(2),
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const venezuelanBanks: VenezuelanBank[] = [
    { code: 'mercantil', name: 'Banco Mercantil', shortName: 'Mercantil' },
    { code: 'banesco', name: 'Banesco', shortName: 'Banesco' },
    { code: 'provincial', name: 'Banco Provincial', shortName: 'Provincial' },
    { code: 'venezuela', name: 'Banco de Venezuela', shortName: 'Banco de Venezuela' },
    { code: 'bicentenario', name: 'Banco Bicentenario', shortName: 'Bicentenario' },
    { code: 'caroni', name: 'Banco Caroní', shortName: 'Caroní' },
    { code: 'exterior', name: 'Banco Exterior', shortName: 'Exterior' },
    { code: 'tesoro', name: 'Banco del Tesoro', shortName: 'Tesoro' },
    { code: 'occidente', name: 'Banco Occidental', shortName: 'Soberano' }
  ];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const handleInputChange = (field: keyof ManualPaymentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSubmitError(null);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reference_number.trim()) {
      setSubmitError('Número de referencia requerido');
      return;
    }
    
    if (!formData.bank_name) {
      setSubmitError('Banco origen requerido');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setSubmitError('Monto inválido');
      return;
    }
    
    if (parseFloat(formData.amount) !== expectedAmount) {
      setSubmitError(`El monto debe ser exactamente $${expectedAmount.toFixed(2)}`);
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await apiFetch('/api/payments/', {
        method: 'POST',
        body: JSON.stringify({
          charge_order: chargeOrderId,
          amount: parseFloat(formData.amount),
          method: 'transfer',
          reference_number: formData.reference_number,
          bank_name: formData.bank_name,
          payment_date: formData.payment_date,
          notes: formData.notes,
          manual_verification: true,
          reason: 'API_CONNECTION_DOWN'
        })
      });
      
      if (response) {
        onVerificationSuccess(response);
        onClose();
      }
    } catch (error: any) {
      setSubmitError(error.message || 'Error al registrar pago');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0b] border border-white/10 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 border border-amber-400 border-t-transparent animate-spin" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
              Manual_Payment_Mode
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        {/* Warning Banner */}
        <div className="px-4 py-3 border-b border-white/5 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />
            <span className="text-[9px] font-mono text-amber-300 uppercase tracking-widest">
              Api_Connection_Down // Manual Registration Required
            </span>
          </div>
        </div>
        {/* Amount Display */}
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
              Expected_Amount
            </span>
            <span className="text-xl font-black text-blue-400">
              ${expectedAmount.toFixed(2)}
            </span>
          </div>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Bank */}
          <div>
            <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">
              Banco_Origen
            </label>
            <select
              value={formData.bank_name}
              onChange={(e) => handleInputChange('bank_name', e.target.value)}
              className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white outline-none focus:border-blue-500/50 transition-all"
              required
            >
              <option value="">Seleccionar banco...</option>
              {venezuelanBanks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.shortName}
                </option>
              ))}
            </select>
          </div>
          {/* Reference */}
          <div>
            <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">
              Numero_Referencia
            </label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={(e) => handleInputChange('reference_number', e.target.value)}
              placeholder="12345678901234567890"
              className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-white/20"
              required
            />
          </div>
          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white outline-none focus:border-blue-500/50 transition-all"
                required
              />
            </div>
            <div>
              <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">
                Fecha_Pago
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => handleInputChange('payment_date', e.target.value)}
                className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white outline-none focus:border-blue-500/50 transition-all"
                style={{colorScheme: 'dark'}}
                required
              />
            </div>
          </div>
          {/* Notes */}
          <div>
            <label className="text-[8px] font-black uppercase tracking-widest text-white/40 block mb-1">
              Notas
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
              className="w-full bg-black/40 border border-white/10 p-3 text-[11px] text-white outline-none focus:border-blue-500/50 transition-all resize-none placeholder:text-white/20"
              placeholder="Notas adicionales..."
            />
          </div>
          {/* Error */}
          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-[10px] text-red-300">{submitError}</span>
            </div>
          )}
          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  Registrar_Pago
                </>
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
          <CreditCardIcon className="w-3 h-3 text-blue-400/40" />
          <span className="text-[7px] font-mono text-white/30 uppercase tracking-[0.3em]">
            Manual_Verification_Mode // Fallback_Active
          </span>
        </div>
      </div>
    </div>
  );
};
export default ManualPaymentModal;