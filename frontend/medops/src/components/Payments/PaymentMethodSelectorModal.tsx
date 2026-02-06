// src/components/Payments/PaymentMethodSelectorModal.tsx
import React, { useState } from 'react';
import { CreditCardIcon, CurrencyDollarIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import EliteModal from '../Common/EliteModal';
interface PaymentMethod {
  id: 'mobile' | 'cash';
  name: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
  popular?: boolean;
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
    name: 'VERIFICACIÓN MÓVIL',
    icon: <CreditCardIcon className="w-8 h-8 text-cyan-500" />,
    description: 'Verificar pagos móviles automáticamente',
    available: true,
    popular: true
  },
  {
    id: 'cash',
    name: 'PAGO EN EFECTIVO',
    icon: <CurrencyDollarIcon className="w-8 h-8 text-emerald-500" />,
    description: 'Registrar pagos en efectivo',
    available: true
  }
];
export default function PaymentMethodSelectorModal({
  chargeOrderId,
  expectedAmount,
  onClose,
  onSuccess
}: PaymentMethodSelectorModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
  };
  const handleClose = () => {
    setSelectedMethod(null);
    onClose();
  };
  const renderPaymentMethodCard = (method: PaymentMethod) => (
    <div
      onClick={() => handleMethodSelect(method)}
      className={`
        relative p-6 border-2 rounded-lg transition-all cursor-pointer
        ${selectedMethod?.id === method.id 
          ? 'border-blue-500 bg-blue-500/20 shadow-lg' 
          : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 hover:bg-gray-600'
        }
      `}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 mt-1">
          {method.icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">
            {method.name}
          </h3>
          <p className="text-sm text-gray-300">
            {method.description}
          </p>
          {method.popular && (
            <span className="inline-block px-2 py-1 bg-blue-500 text-xs text-white rounded-full mt-2">
              POPULAR
            </span>
          )}
          {!method.available && (
            <span className="inline-block px-2 py-1 bg-gray-500 text-xs text-white rounded-full mt-2">
              PRÓXIMAMENTE
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <div className={`w-6 h-6 flex items-center justify-center rounded-full ${
            selectedMethod?.id === method.id ? 'bg-blue-500 text-white' : 'border-2 border-gray-400 text-gray-400'
          }`}>
            {selectedMethod?.id === method.id && <CheckCircleIcon className="w-4 h-4" />}
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <EliteModal
      open={true}
      onClose={handleClose}
      title="SELECCIONAR MÉTODO DE PAGO"
      maxWidth="max-w-4xl"
    >
      <div className="mb-6">
        <p className="text-center text-gray-300 mb-4">
          Seleccione el método de pago para procesar el cargo de <strong>${expectedAmount.toFixed(2)}</strong>
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {PAYMENT_METHODS.map(renderPaymentMethodCard)}
      </div>
      
      <div className="mt-8 flex justify-center gap-4">
        <button
          onClick={handleClose}
          className="px-6 py-3 bg-gray-500 text-gray-300 rounded-lg hover:bg-gray-300 transition-colors"
        >
          CANCELAR
        </button>
        
        <button
          onClick={() => {
            if (selectedMethod?.id === 'mobile') {
              onSuccess({ method: 'mobile', chargeOrderId });
              handleClose();
            } else if (selectedMethod?.id === 'cash') {
              onSuccess({ method: 'cash', chargeOrderId });
              handleClose();
            }
          }}
          disabled={!selectedMethod}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:text-gray-400"
        >
          CONTINUAR
        </button>
      </div>
    </EliteModal>
  );
}