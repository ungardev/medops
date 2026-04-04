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
    name: 'Pago Móvil',
    icon: <CreditCardIcon className="w-5 h-5 text-blue-400" />,
    description: 'Verificar pagos móviles automáticamente vía API bancaria'
  },
  {
    id: 'cash',
    name: 'Efectivo',
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1b] border border-white/15 w-full max-w-lg rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-white/5">
          <h2 className="text-[12px] font-semibold text-white">
            Seleccionar Método de Pago
          </h2>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Monto a Pagar
            </span>
            <span className="text-xl font-semibold text-emerald-400">
              ${expectedAmount.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="p-5 space-y-3">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => handleSelect(method)}
              className={`w-full flex items-center gap-4 p-4 border transition-all text-left rounded-lg ${
                selectedMethod?.id === method.id
                  ? 'bg-emerald-500/10 border-emerald-500/25'
                  : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex-shrink-0">
                {method.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-medium ${
                  selectedMethod?.id === method.id ? 'text-emerald-400' : 'text-white/80'
                }`}>
                  {method.name}
                </p>
                <p className="text-[9px] text-white/30 mt-0.5 truncate">
                  {method.description}
                </p>
              </div>
              <ChevronRightIcon className={`w-4 h-4 flex-shrink-0 transition-colors ${
                selectedMethod?.id === method.id ? 'text-emerald-400' : 'text-white/20'
              }`} />
            </button>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-white/15 bg-white/5 flex flex-col gap-2">
          <button
            onClick={handleContinue}
            disabled={!selectedMethod}
            className="w-full py-2.5 bg-emerald-500/15 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed rounded-lg border border-emerald-500/25"
          >
            Continuar
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-transparent text-white/40 text-[11px] font-medium hover:text-white/60 transition-all rounded-lg hover:bg-white/5"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}