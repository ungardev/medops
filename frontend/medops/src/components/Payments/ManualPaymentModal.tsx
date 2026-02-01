// src/components/Payments/ManualPaymentModal.tsx
import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, CreditCardIcon } from '@heroicons/react/24/outline';
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
  // 🎯 ESTADOS DEL MODAL
  const [formData, setFormData] = useState<ManualPaymentData>({
    reference_number: '',
    bank_name: '',
    amount: expectedAmount.toFixed(2),
    payment_date: new Date().toISOString().split('T')[0],
    notes: 'Pago móvil verificado manualmente - API caída'
  });
  // 🏦 BANCOS VENEZOLANOS COMUNES
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
  // 🎯 MANEJO DE FORMULARIO
  const handleInputChange = (field: keyof ManualPaymentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSubmitError(null);
  };
  // ✅ MANEJO DE REGISTRO MANUAL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🚨 VALIDACIONES BÁSICAS
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
      // 🚀 REGISTRAR PAGO MANUAL
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
        console.log('[MANUAL_PAYMENT] Manual payment registered successfully');
        onVerificationSuccess(response);
        onClose();
      }
    } catch (error: any) {
      console.error('[MANUAL_PAYMENT] Error:', error);
      setSubmitError(`Error al registrar pago: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  // 🎮 COMPONENTE VISUAL
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-lg max-w-md w-full mx-4 shadow-2xl">
        
        {/* 🎯 HEADER */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--palantir-border)]">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <h3 className="text-lg font-bold text-white">[MANUAL_PAYMENT_MODE]</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        {/* 📋 CONTENIDO */}
        <div className="p-4 text-center">
          <p className="text-[10px] font-mono text-yellow-300 uppercase tracking-widest">
            ⚠️ API_CONNECTION_DOWN - REGISTRO MANUAL
          </p>
          <p className="text-[9px] font-mono text-white/60 mt-2">
            El sistema no pudo conectar con el Banco Mercantil. 
            Por favor, registre el pago manualmente.
          </p>
        </div>
        {/* 📋 FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 🔢 BANCO ORIGEN */}
          <div className="space-y-2">
            <label className="text-[8px] font-mono text-gray-300 uppercase tracking-widest">
              BANCO_ORIGEN
            </label>
            <select
              value={formData.bank_name}
              onChange={(e) => handleInputChange('bank_name', e.target.value)}
              className="w-full bg-black/40 border-[var(--palantir-border)] p-3 text-[11px] font-mono text-white outline-none focus:border-cyan-500/50 transition-colors rounded-sm"
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
          {/* 📄 NÚMERO DE REFERENCIA */}
          <div className="space-y-2">
            <label className="text-[8px] font-mono text-gray-300 uppercase tracking-widest">
              REFERENCE_NUMBER
            </label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={(e) => handleInputChange('reference_number', e.target.value)}
              placeholder="Ej: 12345678901234567890"
              className="w-full bg-black/40 border-[var(--palantir-border)] p-3 text-[11px] font-mono text-white outline-none focus:border-cyan-500/50 transition-colors rounded-sm"
              required
            />
          </div>
          {/* 💰 MONTO */}
          <div className="space-y-2">
            <label className="text-[8px] font-mono text-gray-300 uppercase tracking-widest">
              AMOUNT
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="0.00"
              className="w-full bg-black/40 border-[var(--palantir-border)] p-3 text-[11px] font-mono text-white outline-none focus:border-cyan-500/50 transition-colors rounded-sm"
              required
            />
          </div>
          {/* 📅 FECHA DEL PAGO */}
          <div className="space-y-2">
            <label className="text-[8px] font-mono text-gray-300 uppercase tracking-widest">
              PAYMENT_DATE
            </label>
            <input
              type="date"
              value={formData.payment_date}
              onChange={(e) => handleInputChange('payment_date', e.target.value)}
              className="w-full bg-black/40 border-[var(--palantir-border)] p-3 text-[11px] font-mono text-white outline-none focus:border-cyan-500/50 transition-colors rounded-sm"
              required
            />
          </div>
          {/* 📝 NOTAS ADICIONES */}
          <div className="space-y-2">
            <label className="text-[8px] font-mono text-gray-300 uppercase tracking-widest">
              NOTES
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full bg-black/40 border-[var(--palantir-border)] p-3 text-[11px] font-mono text-white outline-none focus:border-cyan-500/50 transition-colors rounded-sm resize-none"
              placeholder="Notas adicionales sobre el pago..."
            />
          </div>
          {/* ❌ ERRORES */}
          {submitError && (
            <div className="p-3 bg-red-500/10 border-red-500/20 rounded-sm">
              <div className="flex items-center gap-2 mb-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
                <span className="text-[8px] font-mono text-red-300 uppercase">ERROR:</span>
              </div>
              <span className="text-red-300 text-[9px] font-mono">{submitError}</span>
            </div>
          )}
          {/* 🎯 BOTONES DE ACCIÓN */}
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                flex-1 py-3 px-4 
                bg-emerald-500/10 border-emerald-500/20 
                text-emerald-400 text-[10px] font-bold uppercase 
                tracking-widest 
                hover:bg-emerald-500/20 
                disabled:opacity-50 
                transition-all
                disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>REGISTERING...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>REGISTER_MANUAL_PAYMENT</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`
                flex-1 py-3 px-4 
                bg-gray-500/10 
                border-gray-500/20 
                text-gray-400 
                text-[10px] font-bold uppercase 
                tracking-widest 
                hover:bg-gray-500/20 
                transition-all
              `}
            >
              <span>CANCEL</span>
            </button>
          </div>
          {/* 📋 INFO ADICIONES */}
          <div className="mt-4 p-3 bg-blue-500/10 border-blue-500/20 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <CreditCardIcon className="w-5 h-5 text-blue-400" />
              <span className="text-[9px] font-mono text-blue-300 uppercase">INFO:</span>
            </div>
            <p className="text-[8px] font-mono text-blue-300 text-[9px] font-mono">
              ESTE MODAL SERÁ IMPLEMENTADO EN EL PASO 6
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ManualPaymentModal;