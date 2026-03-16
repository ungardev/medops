// src/components/Doctor/ServicePurchaseFlow.tsx
import React, { useState, useEffect } from 'react';
import type { DoctorService, PurchaseServiceResponse, ServiceAvailabilityResponse, AvailabilitySlot } from '@/api/patient/client';
import { chargeClient, patientClient } from '@/api/patient/client';
import { Loader2, CreditCardIcon, CheckCircleIcon, XCircleIcon, ArrowRightIcon, AlertTriangle, CalendarIcon, ClockIcon } from 'lucide-react';
// Tipos de estado del flujo
type PurchaseStep = 'confirm-details' | 'confirm-date' | 'confirm-final' | 'processing' | 'success' | 'error';
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
  const [step, setStep] = useState<PurchaseStep>('confirm-details');
  const [error, setError] = useState<string | null>(null);
  const [chargeOrder, setChargeOrder] = useState<PurchaseServiceResponse | null>(null);
  
  // Estado para fecha/hora seleccionada
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  // Cargar disponibilidad cuando cambia la fecha
  useEffect(() => {
    if (step === 'confirm-date' && selectedDate && service.institution) {
      setIsLoadingSlots(true);
      patientClient.getAvailability(service.id, service.institution, selectedDate)
        .then(response => {
          setAvailableSlots(response.data.available_slots);
          setIsLoadingSlots(false);
        })
        .catch(() => {
          setAvailableSlots([]);
          setIsLoadingSlots(false);
        });
    }
  }, [step, selectedDate, service.id, service.institution]);
  const handlePurchase = async () => {
    setStep('processing');
    setError(null);
    
    try {
      const response = await chargeClient.purchaseServiceDirect({
        patient_id: patientId,
        doctor_service_id: service.id,
        institution_id: service.institution,
        tentative_date: selectedDate,
        tentative_time: selectedTime,
        qty: 1,
      });
      
      setChargeOrder(response.data);
      setStep('success');
    } catch (err) {
      console.error("Purchase error:", err);
      setError("Error al procesar la compra. Intenta nuevamente.");
      setStep('error');
    }
  };
  const handleRetry = () => {
    setStep('confirm-details');
    setError(null);
  };
  // Renderizado condicional según el estado
  switch (step) {
    case 'processing':
      return <ProcessingView />;
    case 'success':
      return <SuccessView chargeOrder={chargeOrder} onCancel={onCancel} />;
    case 'error':
      return <ErrorView error={error} onRetry={handleRetry} onCancel={onCancel} />;
    case 'confirm-date':
      return (
        <ConfirmDateView
          service={service}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          availableSlots={availableSlots}
          isLoadingSlots={isLoadingSlots}
          onProceed={() => setStep('confirm-final')}
          onBack={() => setStep('confirm-details')}
          onCancel={onCancel}
        />
      );
    case 'confirm-final':
      return (
        <ConfirmFinalView
          service={service}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onConfirm={handlePurchase}
          onBack={() => setStep('confirm-date')}
          onCancel={onCancel}
        />
      );
    default: // 'confirm-details'
      return <ConfirmDetailsView service={service} onProceed={() => setStep('confirm-date')} onCancel={onCancel} />;
  }
};
// Vista de Confirmación de Detalles (Paso 1)
const ConfirmDetailsView: React.FC<{
  service: DoctorService;
  onProceed: () => void;
  onCancel: () => void;
}> = ({ service, onProceed, onCancel }) => (
  <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-6">
    <h3 className="text-white font-bold text-lg mb-4">Detalles del Servicio</h3>
    
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
        onClick={onProceed}
        className="flex-1 py-3 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-emerald-400 flex items-center justify-center gap-2"
      >
        <CalendarIcon className="w-4 h-4" />
        Seleccionar Fecha
      </button>
    </div>
  </div>
);
// Vista de Selección de Fecha y Hora (Paso 2)
const ConfirmDateView: React.FC<{
  service: DoctorService;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  availableSlots: AvailabilitySlot[];
  isLoadingSlots: boolean;
  onProceed: () => void;
  onBack: () => void;
  onCancel: () => void;
}> = ({ service, selectedDate, setSelectedDate, selectedTime, setSelectedTime, availableSlots, isLoadingSlots, onProceed, onBack, onCancel }) => (
  <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-6">
    <h3 className="text-white font-bold text-lg mb-4">Seleccionar Fecha y Hora</h3>
    
    <div className="mb-4">
      <label className="text-white/70 text-sm block mb-2">Fecha</label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => {
          setSelectedDate(e.target.value);
          setSelectedTime(''); // Reset time when date changes
        }}
        className="w-full bg-black/40 border border-white/10 p-3 text-sm text-white rounded focus:border-emerald-500/50 outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        style={{ colorScheme: 'dark' }}
        min={new Date().toISOString().split('T')[0]} // Prevent past dates
      />
    </div>
    {selectedDate && (
      <div className="mb-6">
        <label className="text-white/70 text-sm block mb-2">Horarios Disponibles</label>
        {isLoadingSlots ? (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
          </div>
        ) : availableSlots.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {availableSlots.map((slot, index) => (
              <button
                key={index}
                onClick={() => setSelectedTime(slot.start)}
                className={`py-2 px-3 rounded-sm text-xs font-mono transition-all ${
                  selectedTime === slot.start
                    ? 'bg-emerald-500 text-black'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                {slot.start}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-white/50 text-sm text-center py-4">No hay horarios disponibles para esta fecha.</p>
        )}
      </div>
    )}
    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="flex-1 py-3 bg-white/10 text-white text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/20"
      >
        Atrás
      </button>
      <button
        onClick={onProceed}
        disabled={!selectedDate || !selectedTime}
        className="flex-1 py-3 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-emerald-400 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <ClockIcon className="w-4 h-4" />
        Confirmar Horario
      </button>
    </div>
  </div>
);
// Vista de Confirmación Final (Paso 3)
const ConfirmFinalView: React.FC<{
  service: DoctorService;
  selectedDate: string;
  selectedTime: string;
  onConfirm: () => void;
  onBack: () => void;
  onCancel: () => void;
}> = ({ service, selectedDate, selectedTime, onConfirm, onBack, onCancel }) => (
  <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-6">
    <div className="flex items-center gap-3 mb-4 text-amber-400">
      <AlertTriangle className="w-8 h-8" />
      <h3 className="text-white font-bold text-lg">Confirmar Compra</h3>
    </div>
    
    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-sm">
      <p className="text-amber-200 text-sm">
        ¿Estás seguro de que deseas solicitar el servicio <strong>{service.name}</strong> por <strong>$ {service.price_usd?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>?
      </p>
      <div className="mt-3 text-white/80 text-sm">
        <p>Fecha: {selectedDate}</p>
        <p>Hora: {selectedTime}</p>
        <p className="text-white/50 text-xs mt-2">Nota: Esta es una fecha tentativa. El doctor la confirmará pronto.</p>
      </div>
    </div>
    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="flex-1 py-3 bg-white/10 text-white text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/20"
      >
        Atrás
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
    <p className="text-white/80 text-sm font-mono">PROCESANDO SOLICITUD...</p>
    <p className="text-white/50 text-xs mt-2">Por favor espera</p>
  </div>
);
// Vista de Éxito (Solicitud Recibida)
const SuccessView: React.FC<{ chargeOrder: PurchaseServiceResponse | null; onCancel: () => void }> = ({
  chargeOrder,
  onCancel
}) => (
  <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-8 flex flex-col items-center justify-center min-h-[200px]">
    <CheckCircleIcon className="w-16 h-16 text-emerald-500 mb-4" />
    <h4 className="text-white font-bold text-lg mb-2">¡Solicitud Recibida!</h4>
    <p className="text-white/70 text-sm mb-4">
      Tu solicitud de servicio ha sido registrada correctamente.
    </p>
    <div className="bg-[#1a1a1b] border border-white/10 rounded-sm p-4 mb-4 w-full">
      <p className="text-white/50 text-xs mb-1">Número de Orden</p>
      <p className="text-white font-mono text-lg"># {chargeOrder?.id}</p>
    </div>
    <p className="text-white/50 text-xs mb-6 text-center">
      Procede a cancelar el monto correspondiente para agendar tu cita.
    </p>
    <div className="flex gap-3 w-full">
      <button
        onClick={onCancel}
        className="flex-1 py-3 bg-white/10 text-white text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/20"
      >
        Cerrar
      </button>
      <a
        href={`/patient/charge-orders/${chargeOrder?.id}/pay`}
        className="flex-1 py-3 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-emerald-400 flex items-center justify-center gap-2 text-center"
      >
        Ir a Pagar <ArrowRightIcon className="w-4 h-4" />
      </a>
    </div>
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
      <h4 className="text-white font-bold text-lg">Error en la Solicitud</h4>
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
        className="flex-1 py-3 bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-emerald-400 flex items-center justify-center gap-2"
      >
        <Loader2 className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  </div>
);