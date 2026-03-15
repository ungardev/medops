// src/components/Doctor/ServicePurchaseFlow.tsx
import React, { useState } from 'react';
import type { DoctorService, PurchaseServiceResponse } from '@/api/patient/client';
import { chargeClient } from '@/api/patient/client';
import { Loader2, CreditCardIcon, CheckCircleIcon, XCircleIcon, ArrowRightIcon } from 'lucide-react';
// Tipos de estado del flujo
type PurchaseStep = 'confirm' | 'processing' | 'success' | 'error';
interface ServicePurchaseFlowProps {
  service: DoctorService;
  patientId: number;
  onSuccess: () => void;
  onCancel: () => void;
}
export const ServicePurchaseFlow: React.FC<ServicePurchaseFlowProps> = ({
  service,
  patientId,
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<PurchaseStep>('confirm');
  const [error, setError] = useState<string | null>(null);
  const [chargeOrder, setChargeOrder] = useState<PurchaseServiceResponse | null>(null);
  const [countdown, setCountdown] = useState(2);
  const handlePurchase = async () => {
    setStep('processing');
    setError(null);
    
    try {
      const response = await chargeClient.purchaseServiceDirect({
        patient_id: patientId,
        doctor_service_id: service.id,
        qty: 1,
      });
      
      // TypeScript ahora sabe que response.data es PurchaseServiceResponse
      setChargeOrder(response.data);
      setStep('success');
      
      // Redirección automática después de 2 segundos
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = `/patient/charge-orders/${response.data.id}/pay`;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (err) {
      console.error("Purchase error:", err);
      setError("Error al procesar la compra. Intenta nuevamente.");
      setStep('error');
    }
  };
  const handleRetry = () => {
    setStep('confirm');
    setError(null);
  };
  // Renderizado condicional según el estado
  switch (step) {
    case 'processing':
      return <ProcessingView />;
    case 'success':
      return <SuccessView chargeOrder={chargeOrder} countdown={countdown} />;
    case 'error':
      return <ErrorView error={error} onRetry={handlePurchase} onCancel={onCancel} />;
    default: // 'confirm'
      return <ConfirmView service={service} onConfirm={handlePurchase} onCancel={onCancel} />;
  }
};
// Vista de Confirmación
const ConfirmView: React.FC<{
  service: DoctorService;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ service, onConfirm, onCancel }) => (
  <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-6">
    <h3 className="text-white font-bold text-lg mb-4">Confirmar Compra</h3>
    
    <div className="mb-6 p-4 bg-white/5 rounded-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white/80">{service.name}</span>
        <span className="text-emerald-400 font-mono">
          $ {service.price_usd?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className="text-white/50 text-sm">
        Duración: {service.duration_minutes} min
      </div>
    </div>
    <div className="flex gap-3">
      <button
        onClick={onCancel}
        className="flex-1 py-3 bg-white/10 text-white text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/20"
      >
        Cancelar
      </button>
      <button
        onClick={onConfirm}
        className="flex-1 py-3 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-emerald-400 flex items-center justify-center gap-2"
      >
        <CreditCardIcon className="w-4 h-4" />
        Confirmar Compra
      </button>
    </div>
  </div>
);
// Vista de Procesamiento
const ProcessingView: React.FC = () => (
  <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-8 flex flex-col items-center justify-center min-h-[200px]">
    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
    <p className="text-white/80 text-sm font-mono">PROCESANDO COMPRA...</p>
    <p className="text-white/50 text-xs mt-2">Por favor espera</p>
  </div>
);
// Vista de Éxito
const SuccessView: React.FC<{ chargeOrder: PurchaseServiceResponse | null; countdown: number }> = ({
  chargeOrder,
  countdown,
}) => (
  <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-8 flex flex-col items-center justify-center min-h-[200px]">
    <CheckCircleIcon className="w-16 h-16 text-emerald-500 mb-4" />
    <h4 className="text-white font-bold text-lg mb-2">¡Compra Exitosa!</h4>
    <p className="text-white/70 text-sm mb-4">
      Orden #{chargeOrder?.id} creada correctamente
    </p>
    <p className="text-white/50 text-xs mb-6">
      Redirigiendo a pago en {countdown} segundos...
    </p>
    <a
      href={`/patient/charge-orders/${chargeOrder?.id}/pay`}
      className="text-emerald-400 text-sm hover:text-emerald-300 flex items-center gap-2"
    >
      Ir a pagar ahora
      <ArrowRightIcon className="w-4 h-4" />
    </a>
  </div>
);
// Vista de Error
const ErrorView: React.FC<{
  error: string | null;
  onRetry: () => void;
  onCancel: () => void;
}> = ({ error, onRetry, onCancel }) => (
  <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-6">
    <div className="flex items-center gap-3 mb-4">
      <XCircleIcon className="w-8 h-8 text-red-500" />
      <h4 className="text-white font-bold text-lg">Error en la Compra</h4>
    </div>
    
    <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-sm">
      <p className="text-red-300 text-sm">{error || 'Error desconocido'}</p>
    </div>
    <div className="flex gap-3">
      <button
        onClick={onCancel}
        className="flex-1 py-3 bg-white/10 text-white text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/20"
      >
        Cancelar
      </button>
      <button
        onClick={onRetry}
        className="flex-1 py-3 bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-amber-400 flex items-center justify-center gap-2"
      >
        <Loader2 className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  </div>
);