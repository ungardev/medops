// src/components/Payments/PaymentMethodSelectorModal.tsx
import React, { useState } from 'react';
import { 
  CreditCardIcon, 
  CurrencyDollarIcon, 
  ChevronRightIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
interface PaymentMethod {
  id: 'mobile' | 'cash';
  name: string;
  icon: React.ReactNode;
  description: string;
}
interface PaymentMethodSelectorModalProps {
  chargeOrderId: number;
  expectedAmount: number;
  onClose: () => void;
  onSuccess: (paymentData: any) => void;
}
const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'mobile',
    name: 'MOVIL_VERIFICACION',
    icon: <CreditCardIcon className="w-5 h-5 text-blue-400" />,
    description: 'Verificar pagos móviles automáticamente vía API bancaria'
  },
  {
    id: 'cash',
    name: 'EFECTIVO_MANUAL',
    icon: <CurrencyDollarIcon className="w-5 h-5 text-emerald-400" />,
    description: 'Registrar pago en efectivo manualmente'
  }
];
export default function PaymentMethodSelectorModal({
  chargeOrderId,
  expectedAmount,
  onClose,
  onSuccess
}: PaymentMethodSelectorModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const handleSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };
  const handleContinue = () => {
    if (!selectedMethod) return;
    onSuccess({ method: selectedMethod.id, chargeOrderId });
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0b] border border-white/10 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
            Select_Payment_Method
          </h2>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        {/* Amount Display */}
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">
              Monto_A_Pagar
            </span>
            <span className="text-xl font-black text-emerald-400">
              ${expectedAmount.toFixed(2)}
            </span>
          </div>
        </div>
        {/* Methods List */}
        <div className="p-4 space-y-2">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => handleSelect(method)}
              className={`w-full flex items-center gap-4 p-4 border transition-all text-left ${
                selectedMethod?.id === method.id
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex-shrink-0">
                {method.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-black uppercase tracking-widest ${
                  selectedMethod?.id === method.id ? 'text-emerald-400' : 'text-white'
                }`}>
                  {method.name}
                </p>
                <p className="text-[9px] text-white/40 mt-0.5 truncate">
                  {method.description}
                </p>
              </div>
              <ChevronRightIcon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                selectedMethod?.id === method.id ? 'text-emerald-400' : 'text-white/20'
              }`} />
            </button>
          ))}
        </div>
        {/* Actions */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleContinue}
            disabled={!selectedMethod}
            className="w-full py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Continuar
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 mt-2 bg-transparent text-white/40 text-[9px] font-black uppercase tracking-widest hover:text-white/60 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}