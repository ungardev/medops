// src/components/Doctor/ServicePurchaseFlow.tsx
import React, { useState, useEffect } from 'react';
import type { DoctorService, ServiceAvailabilityResponse, AvailabilitySlot } from '@/api/patient/client';
import { patientClient } from '@/api/patient/client';
import { createAppointment } from '@/api/appointments';
import type { AppointmentInput } from '@/types/appointments';
import { useAllServiceSchedules } from '@/hooks/services/useAllServiceSchedules';
import InteractiveCalendar from "@/components/Appointments/InteractiveCalendar";
import { 
  Loader2, 
  CreditCardIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowRightIcon, 
  AlertTriangle, 
  CalendarIcon, 
  ClockIcon 
} from 'lucide-react';
// Tipos de estado del flujo
type PurchaseStep = 'confirm-date' | 'confirm-final' | 'processing' | 'success' | 'error';
interface ServicePurchaseFlowProps {
  service: DoctorService;
  patientId: number;
  onSuccess: () => void;
  onCancel: () => void;
}
// Tipo para los slots transformados para InteractiveCalendar
interface TransformedSlot {
  time: string;
  label: string;
}
export const ServicePurchaseFlow: React.FC<ServicePurchaseFlowProps> = ({
  service,
  patientId,
  onSuccess,
  onCancel,
}) => {
  // CAMBIO: Iniciar directamente en la vista de fecha
  const [step, setStep] = useState<PurchaseStep>('confirm-date');
  const [error, setError] = useState<string | null>(null);
  const [chargeOrder, setChargeOrder] = useState<any | null>(null);
  
  // Estado para fecha/hora seleccionada
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  // Obtener horarios del servicio (para el calendario visual)
  const { data: serviceSchedules = [] } = useAllServiceSchedules(service.institution);
  // Filtrar horarios para el servicio específico actual
  const filteredSchedules = serviceSchedules.filter((schedule: any) => schedule.service === service.id);
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
  // Función handlePurchase modificada para crear una Appointment
  const handlePurchase = async () => {
    setStep('processing');
    setError(null);
    
    try {
      const appointmentData: AppointmentInput = {
        patient: patientId,
        doctor: service.doctor,
        institution: service.institution,
        doctor_service: service.id,
        appointment_date: selectedDate,
        tentative_date: selectedDate,
        tentative_time: selectedTime,
        status: 'tentative',
        appointment_type: 'general',
        services: [{ doctor_service_id: service.id, qty: 1 }]
      };
      
      const response = await createAppointment(appointmentData);
      const chargeOrderData = response.charge_order;
      
      if (!chargeOrderData) {
         throw new Error("No se generó la orden de cobro automáticamente");
      }
      
      setChargeOrder(chargeOrderData);
      setStep('success');
    } catch (err) {
      console.error("Purchase error:", err);
      setError("Error al procesar la compra. Intenta nuevamente.");
      setStep('error');
    }
  };
  const handleRetry = () => {
    setStep('confirm-date'); // Reiniciar en calendario
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
                isLoadingSlots={isLoadingSlots} 
                onProceed={() => setStep('confirm-final')} 
                onBack={onCancel} 
                onCancel={onCancel}
                schedules={filteredSchedules}
              />;
  }
};
// Vista de Selección de Fecha y Hora (Paso 1 - Ahora Calendario Visual)
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
  schedules: any[];
}> = ({ service, selectedDate, setSelectedDate, selectedTime, setSelectedTime, availableSlots, isLoadingSlots, onProceed, onBack, onCancel, schedules }) => {
  
  // CORRECCIÓN: Transformar AvailabilitySlot[] al formato esperado por InteractiveCalendar
  const transformedSlots: TransformedSlot[] = availableSlots.map(slot => ({
    time: slot.start,      // Usamos la propiedad 'start' como 'time'
    label: slot.start      // Usamos la propiedad 'start' como 'label'
  }));
  // Convertir string a Date para el componente InteractiveCalendar
  const selectedDateObj = selectedDate ? new Date(selectedDate) : null;
  return (
    <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-6">
      <h3 className="text-white font-bold text-lg mb-4">Seleccionar Fecha y Hora</h3>
      
      {/* Contenedor del Calendario Visual */}
      <div className="mb-6">
        <InteractiveCalendar
          selectedDate={selectedDateObj}
          onDateSelect={(date) => {
            setSelectedDate(date ? date.toISOString().split('T')[0] : '');
            setSelectedTime(''); // Reset time when date changes
          }}
          serviceSchedules={schedules}
          selectedServiceId={service.id}
          availableSlots={transformedSlots} // USAMOS LOS SLOTS TRANSFORMADOS
          onTimeSelect={setSelectedTime}
          selectedTime={selectedTime}
        />
      </div>
      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={onBack} // Cierra el modal
          className="flex-1 py-3 bg-white/10 text-white text-[10px] font-black uppercase tracking-wider rounded-sm hover:bg-white/20"
        >
          Volver
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
};
// Vista de Confirmación Final (Paso 2)
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
      <div className="mt-3 text-white/80 text-sm space-y-1">
        <div className="flex justify-between">
            <span className="text-white/50">Institución:</span>
            <span>{service.institution_name || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-white/50">Fecha:</span>
            <span>{selectedDate}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-white/50">Hora:</span>
            <span>{selectedTime}</span>
        </div>
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
// Vista de Éxito
const SuccessView: React.FC<{ chargeOrder: any | null; onCancel: () => void }> = ({
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