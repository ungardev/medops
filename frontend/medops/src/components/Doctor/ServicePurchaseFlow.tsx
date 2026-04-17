// src/components/Doctor/ServicePurchaseFlow.tsx
import React, { useState, useMemo } from 'react';
import type { DoctorService, AvailabilitySlot } from '@/api/patient/client';
import { useAllServiceSchedules } from '@/hooks/services/useAllServiceSchedules';
import SimpleCalendar from "@/components/Common/SimpleCalendar";
import { 
  Loader2, 
  CreditCardIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowRightIcon, 
  AlertTriangle, 
  ClockIcon 
} from 'lucide-react';
type PurchaseStep = 'confirm-date' | 'confirm-final' | 'processing' | 'success' | 'error';
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
  const [step, setStep] = useState<PurchaseStep>('confirm-date');
  const [error, setError] = useState<string | null>(null);
  const [chargeOrder, setChargeOrder] = useState<any | null>(null);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  const { data: serviceSchedules = [] } = useAllServiceSchedules(service.institution);
  
  const filteredSchedules = serviceSchedules.filter((schedule: any) => schedule.service === service.id);
  
  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    const jsDayOfWeek = selectedDateObj.getDay();
    const pythonDayOfWeek = jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1;
    const serviceSchedulesForService = filteredSchedules.filter(
      (schedule: any) => schedule.day_of_week === pythonDayOfWeek
    );
    
    const slots: { time: string; label: string }[] = [];
    serviceSchedulesForService.forEach((schedule: any) => {
      const startTime = new Date(`2000-01-01T${schedule.start_time}`);
      const endTime = new Date(`2000-01-01T${schedule.end_time}`);
      const slotDuration = schedule.slot_duration || 30;
      
      let currentTime = startTime;
      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
        if (slotEnd <= endTime) {
          const timeStr = currentTime.toTimeString().slice(0, 5);
          slots.push({ time: timeStr, label: timeStr });
        }
        currentTime = slotEnd;
      }
    });
    
    return slots;
  }, [selectedDate, filteredSchedules]);
  
  const handlePurchase = async () => {
    setStep('processing');
    setError(null);
    
    try {
      const token = localStorage.getItem('patient_drf_token') || localStorage.getItem('patient_access_token');
      
      const response = await fetch('/api/charge-orders/create-from-service/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
        body: JSON.stringify({
          patient_id: patientId,
          doctor_service_id: service.id,
          institution_id: service.institution,
          tentative_date: selectedDate,
          tentative_time: selectedTime,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la orden de cobro');
      }
      
      const chargeOrderData = await response.json();
      setChargeOrder(chargeOrderData);
      setStep('success');
    } catch (err: any) {
      console.error("Purchase error:", err);
      setError(err.message || "Error al procesar la compra. Intenta nuevamente.");
      setStep('error');
    }
  };
  const handleRetry = () => {
    setStep('confirm-date');
    setError(null);
  };
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
          onProceed={() => setStep('confirm-final')}
          onBack={onCancel}
          onCancel={onCancel}
          schedules={filteredSchedules}
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
    default:
      return <ConfirmDateView 
                service={service} 
                selectedDate={selectedDate} 
                setSelectedDate={setSelectedDate} 
                selectedTime={selectedTime} 
                setSelectedTime={setSelectedTime} 
                availableSlots={availableSlots} 
                onProceed={() => setStep('confirm-final')} 
                onBack={onCancel} 
                onCancel={onCancel}
                schedules={filteredSchedules}
              />;
  }
};
const ConfirmDateView: React.FC<{
  service: DoctorService;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  availableSlots: { time: string; label: string }[];
  onProceed: () => void;
  onBack: () => void;
  onCancel: () => void;
  schedules: any[];
}> = ({ service, selectedDate, setSelectedDate, selectedTime, setSelectedTime, availableSlots, onProceed, onBack, onCancel, schedules }) => {
  
  const selectedDateObj = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;
  
  const handleDateSelect = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
    } else {
      setSelectedDate('');
    }
    setSelectedTime('');
  };
  
  return (
    <div className="bg-white/5 border border-white/15 rounded-lg p-6">
      <h3 className="text-white/80 font-medium text-lg mb-4">Seleccionar Fecha y Hora</h3>
      
      <div className="mb-6">
        <SimpleCalendar
          selectedDate={selectedDateObj}
          onDateSelect={handleDateSelect}
          serviceSchedules={schedules}
        />
      </div>
      
      {availableSlots.length > 0 && (
        <div className="mb-4">
          <label className="text-white/50 text-sm block mb-2">Horarios Disponibles</label>
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
            {availableSlots.map((slot, index) => (
              <button
                key={index}
                onClick={() => setSelectedTime(slot.time)}
                className={`py-2 px-3 rounded-lg text-xs transition-all ${
                  selectedTime === slot.time
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {availableSlots.length === 0 && selectedDate && (
        <div className="mb-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-amber-400/70 text-sm text-center">
          No hay horarios específicos para este día. La hora será confirmada por el doctor.
        </div>
      )}
      
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-2.5 bg-white/5 text-white/60 text-[10px] font-medium rounded-lg hover:bg-white/10 transition-all"
        >
          Volver
        </button>
        <button
          onClick={onProceed}
          disabled={!selectedDate}
          className="flex-1 py-2.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-medium rounded-lg hover:bg-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 transition-all border border-emerald-500/25"
        >
          <ClockIcon className="w-4 h-4" />
          Confirmar Horario
        </button>
      </div>
    </div>
  );
};
const ConfirmFinalView: React.FC<{
  service: DoctorService;
  selectedDate: string;
  selectedTime: string;
  onConfirm: () => void;
  onBack: () => void;
  onCancel: () => void;
}> = ({ service, selectedDate, selectedTime, onConfirm, onBack, onCancel }) => (
  <div className="bg-white/5 border border-white/15 rounded-lg p-6">
    <div className="flex items-center gap-3 mb-4 text-amber-400/70">
      <AlertTriangle className="w-8 h-8" />
      <h3 className="text-white/80 font-medium text-lg">Confirmar Compra</h3>
    </div>
    
    <div className="mb-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
      <p className="text-amber-400/80 text-sm">
        ¿Estás seguro de que deseas solicitar el servicio <strong>{service.name}</strong> por <strong>$ {service.price_usd?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>?
      </p>
      <div className="mt-3 text-white/60 text-sm space-y-1">
        <div className="flex justify-between">
            <span className="text-white/40">Institución:</span>
            <span>{service.institution_name || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-white/40">Fecha:</span>
            <span>{selectedDate}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-white/40">Hora:</span>
            <span>{selectedTime || 'Por confirmar'}</span>
        </div>
        <p className="text-white/30 text-xs mt-2">Nota: Esta es una fecha tentativa. El doctor la confirmará pronto.</p>
      </div>
    </div>
    <div className="flex gap-3">
      <button
        onClick={onBack}
        className="flex-1 py-2.5 bg-white/5 text-white/60 text-[10px] font-medium rounded-lg hover:bg-white/10 transition-all"
      >
        Atrás
      </button>
      <button
        onClick={onConfirm}
        className="flex-1 py-2.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-medium rounded-lg hover:bg-emerald-500/25 flex items-center justify-center gap-2 transition-all border border-emerald-500/25"
      >
        <CreditCardIcon className="w-4 h-4" />
        Confirmar Compra
      </button>
    </div>
  </div>
);
const ProcessingView: React.FC = () => (
  <div className="bg-white/5 border border-white/15 rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px]">
    <Loader2 className="w-12 h-12 text-emerald-400/60 animate-spin mb-4" />
    <p className="text-white/60 text-sm">Procesando solicitud...</p>
    <p className="text-white/30 text-xs mt-2">Por favor espera</p>
  </div>
);
const SuccessView: React.FC<{ chargeOrder: any | null; onCancel: () => void }> = ({
  chargeOrder,
  onCancel
}) => (
  <div className="bg-white/5 border border-white/15 rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px]">
    <CheckCircleIcon className="w-16 h-16 text-emerald-400 mb-4" />
    <h4 className="text-white/80 font-medium text-lg mb-2">¡Solicitud Recibida!</h4>
    <p className="text-white/50 text-sm mb-4">
      Tu solicitud de servicio ha sido registrada correctamente.
    </p>
    <div className="bg-black/20 border border-white/10 rounded-lg p-4 mb-4 w-full">
      <p className="text-white/30 text-xs mb-1">Número de Orden</p>
      <p className="text-white/80 font-medium text-lg"># {chargeOrder?.id}</p>
    </div>
    <p className="text-white/30 text-xs mb-6 text-center">
      Procede a cancelar el monto correspondiente para agendar tu cita.
    </p>
    <div className="flex gap-3 w-full">
      <button
        onClick={onCancel}
        className="flex-1 py-2.5 bg-white/5 text-white/60 text-[10px] font-medium rounded-lg hover:bg-white/10 transition-all"
      >
        Cerrar
      </button>
      <a
        href={`/patient/payments/${chargeOrder?.id}`}
        className="flex-1 py-2.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-medium rounded-lg hover:bg-emerald-500/25 flex items-center justify-center gap-2 text-center transition-all border border-emerald-500/25"
      >
        Ir a Pagar <ArrowRightIcon className="w-4 h-4" />
      </a>
    </div>
  </div>
);
const ErrorView: React.FC<{
  error: string | null;
  onRetry: () => void;
  onCancel: () => void;
}> = ({ error, onRetry, onCancel }) => (
  <div className="bg-white/5 border border-white/15 rounded-lg p-6">
    <div className="flex items-center gap-3 mb-4">
      <XCircleIcon className="w-8 h-8 text-red-400" />
      <h4 className="text-white/80 font-medium text-lg">Error en la Solicitud</h4>
    </div>
    
    <div className="mb-6 p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
      <p className="text-red-400/80 text-sm">{error || 'Error desconocido'}</p>
    </div>
    <div className="flex gap-3">
      <button
        onClick={onCancel}
        className="flex-1 py-2.5 bg-white/5 text-white/60 text-[10px] font-medium rounded-lg hover:bg-white/10 transition-all"
      >
        Cancelar
      </button>
      <button
        onClick={onRetry}
        className="flex-1 py-2.5 bg-amber-500/10 text-amber-400 text-[10px] font-medium rounded-lg hover:bg-amber-500/15 flex items-center justify-center gap-2 transition-all border border-amber-500/20"
      >
        <Loader2 className="w-4 h-4" />
        Reintentar
      </button>
    </div>
  </div>
);