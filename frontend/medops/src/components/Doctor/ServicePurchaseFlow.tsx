// src/components/Doctor/ServicePurchaseFlow.tsx
import React, { useState } from 'react';
import type { DoctorService } from '@/api/patient/client';
// Corregido: Importar chargeClient directamente (no como miembro)
import { chargeClient } from '@/api/patient/client';
import { Loader2, CreditCardIcon } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handlePurchase = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      await chargeClient.purchaseServiceDirect({
        patientId,
        serviceId: service.id,
        qty: 1,
      });
      onSuccess();
    } catch (err) {
      console.error("Purchase error:", err);
      setError("Error al procesar la compra. Intenta nuevamente.");
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-6">
      <h3 className="text-white font-bold text-lg mb-4">Confirmar Compra</h3>
      
      <div className="mb-6 p-4 bg-white/5 rounded-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/80">{service.name}</span>
          <span className="text-white font-mono">
            Bs {service.price_ves?.toLocaleString('es-VE')}
          </span>
        </div>
        <div className="text-white/50 text-sm">
          Duración: {service.duration_minutes} min
        </div>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-sm">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 py-3 bg-white/10 text-white text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/20 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handlePurchase}
          disabled={isProcessing}
          className="flex-1 py-3 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-emerald-400 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CreditCardIcon className="w-4 h-4" />
              Pagar Ahora
            </>
          )}
        </button>
      </div>
    </div>
  );
};