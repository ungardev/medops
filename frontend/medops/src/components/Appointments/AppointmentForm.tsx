// src/components/Appointments/AppointmentForm.tsx
import React, { useState, useEffect, useMemo } from "react";
import { AppointmentInput } from "types/appointments";
import type { Patient } from "types/patients";
import type { DoctorService, ServiceCategory } from "@/types/services";
import { usePatients } from "hooks/patients/usePatients";
import { useInstitutions } from "hooks/settings/useInstitutions";
import { useDoctorConfig } from "hooks/settings/useDoctorConfig";
import { useServiceCategories } from "@/hooks/services/useServiceCategories";
import { useDoctorServicesSearch } from "@/hooks/services/useDoctorServices";
import { useBCVRate, convertUSDToVES } from "@/hooks/dashboard/useBCVRate";
import { useAllServiceSchedules } from '@/hooks/services/useAllServiceSchedules';
import NewPatientModal from "components/Patients/NewPatientModal";
import { 
  UserPlusIcon, 
  XMarkIcon, 
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  BeakerIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
interface Props {
  date?: Date;
  onClose: () => void;
  onSubmit: (data: AppointmentInput) => Promise<void> | void;
}
interface FormErrors {
  patient?: string;
  services?: string;
  appointment_date?: string;
  appointment_time?: string;
}
interface TemporaryService {
  id: number | string;
  code: string;
  name: string;
  price_usd: number;
  price_ves?: number;
  category?: number | null;
  category_name?: string;
  doctor?: number;
  duration_minutes: number;
  is_active: boolean;
  is_visible_global: boolean;
}
interface SelectedService {
  service: TemporaryService;
  quantity: number;
}
export default function AppointmentForm({ date, onClose, onSubmit }: Props) {
  const { institutions, activeInstitution } = useInstitutions();
  const { data: doctorConfig } = useDoctorConfig();
  const { data: bcvRate } = useBCVRate();
  
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  
  // ✅ NUEVO: Estado para servicio y fecha seleccionados
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(date || null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  const { data, isLoading: isLoadingPatients, isError: isErrorPatients, refetch } = usePatients(1, 100);
  const patientList: Patient[] = data?.results ?? [];
  
  const { data: categories = [] } = useServiceCategories();
  const { data: serviceResults = [], isFetching: isFetchingServices } = useDoctorServicesSearch(serviceSearch);
  
  const institutionId = activeInstitution?.id ?? 0;
  const { data: serviceSchedules = [] } = useAllServiceSchedules(institutionId);
  
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patientList;
    const search = patientSearch.toLowerCase();
    return patientList.filter((p) => 
      p.full_name?.toLowerCase().includes(search) ||
      p.national_id?.toLowerCase().includes(search) ||
      p.email?.toLowerCase().includes(search)
    );
  }, [patientList, patientSearch]);
  
  const groupedServices = useMemo(() => {
    const groups: Record<string, TemporaryService[]> = {};
    serviceResults.forEach(item => {
      const cat = item.category_name || "OTROS";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({
        id: item.id,
        code: item.code,
        name: item.name,
        price_usd: item.price_usd,
        price_ves: bcvRate ? convertUSDToVES(item.price_usd, bcvRate) : undefined,
        category: item.category,
        category_name: item.category_name,
        doctor: item.doctor,
        duration_minutes: item.duration_minutes || 30,
        is_active: item.is_active || true,
        is_visible_global: item.is_visible_global || true,
      } as TemporaryService);
    });
    return groups;
  }, [serviceResults, bcvRate]);
  
  const doctorId = doctorConfig?.id ?? 0;
  
  const [form, setForm] = useState<AppointmentInput>({
    patient: 0,
    institution: institutionId,
    doctor: doctorId,
    appointment_date: date ? date.toISOString().slice(0, 10) : "",
    appointment_type: "general",
    expected_amount: "",
    notes: "",
  });
  
  const [hasChanges, setHasChanges] = useState(false);
  
  // ✅ NUEVO: Generar slots disponibles basados en horarios
  const availableSlots = useMemo(() => {
    if (!selectedServiceId || !selectedDate) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const serviceSchedulesForService = serviceSchedules.filter(
      s => s.service === selectedServiceId && s.day_of_week === dayOfWeek
    );
    
    const slots: { time: string; label: string }[] = [];
    serviceSchedulesForService.forEach(schedule => {
      const startTime = new Date(`2000-01-01T${schedule.start_time}`);
      const endTime = new Date(`2000-01-01T${schedule.end_time}`);
      const slotDuration = schedule.slot_duration;
      
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
  }, [selectedServiceId, selectedDate, serviceSchedules]);
  
  useEffect(() => {
    if (activeInstitution?.id) {
      setForm((prev) => ({
        ...prev,
        institution: activeInstitution.id!,
      }));
    }
  }, [activeInstitution?.id]);
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges || selectedPatient || selectedServices.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges, selectedPatient, selectedServices]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
    setTouched(prev => ({ ...prev, [name]: true }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setForm(prev => ({ ...prev, patient: patient.id }));
    setPatientSearch("");
    setHasChanges(true);
    setTouched(prev => ({ ...prev, patient: true }));
    if (errors.patient) setErrors(prev => ({ ...prev, patient: undefined }));
  };
  
  const handleAddService = (service: DoctorService) => {
    const tempService: TemporaryService = {
      id: service.id,
      code: service.code,
      name: service.name,
      price_usd: service.price_usd,
      price_ves: bcvRate ? convertUSDToVES(service.price_usd, bcvRate) : undefined,
      category: service.category,
      category_name: service.category_name,
      doctor: service.doctor,
      duration_minutes: service.duration_minutes || 30,
      is_active: service.is_active || true,
      is_visible_global: service.is_visible_global || true,
    };
    
    const existing = selectedServices.find(s => s.service.id === service.id);
    if (existing) {
      setSelectedServices(prev => prev.map(s => 
        s.service.id === service.id 
          ? { ...s, quantity: s.quantity + 1 }
          : s
      ));
    } else {
      setSelectedServices(prev => [...prev, { service: tempService, quantity: 1 }]);
    }
    
    // ✅ NUEVO: Establecer servicio seleccionado para filtrar horarios
    setSelectedServiceId(service.id);
    
    setServiceSearch("");
    setHasChanges(true);
    setTouched(prev => ({ ...prev, services: true }));
    if (errors.services) setErrors(prev => ({ ...prev, services: undefined }));
  };
  
  const handleRemoveService = (serviceId: number | string) => {
    setSelectedServices(prev => prev.filter(s => s.service.id !== serviceId));
    // ✅ NUEVO: Limpiar servicio seleccionado si se quita el único
    if (selectedServices.length === 1 && selectedServices[0].service.id === serviceId) {
      setSelectedServiceId(null);
    }
    setHasChanges(true);
  };
  
  const handleServiceQuantity = (serviceId: number | string, delta: number) => {
    setSelectedServices(prev => prev.map(s => 
      s.service.id === serviceId 
        ? { ...s, quantity: Math.max(1, s.quantity + delta) }
        : s
    ));
    setHasChanges(true);
  };
  
  const totalAmount = selectedServices.reduce(
    (sum, s) => sum + (Number(s.service.price_usd) * s.quantity),
    0
  );
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ patient: true, services: true, appointment_date: true });
    
    const newErrors: FormErrors = {};
    if (!selectedPatient) newErrors.patient = "REQUIRED_FIELD: Select patient";
    if (selectedServices.length === 0) newErrors.services = "REQUIRED_FIELD: Add at least one service";
    if (!form.appointment_date) newErrors.appointment_date = "REQUIRED_FIELD: Select date";
    if (!selectedTime) newErrors.appointment_time = "REQUIRED_FIELD: Select time";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const payload: AppointmentInput = {
        ...form,
        patient: selectedPatient!.id,
        appointment_date: form.appointment_date,
        start_time: selectedTime, // ✅ CORREGIDO: Usar start_time en lugar de appointment_time
        expected_amount: totalAmount.toString(),
        services: selectedServices.map(s => ({
          doctor_service_id: Number(s.service.id),
          qty: s.quantity,
        })),
      };
      
      await onSubmit(payload);
      setHasChanges(false);
      onClose();
    } catch (err: any) {
      console.error("Submit error:", err);
      setSubmitError(err?.message || "SUBMIT_FAILED");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-white/20 text-white/60 bg-white/5">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">
              NUEVA CITA
            </span>
            <h2 className="text-lg font-black text-white uppercase">
              CREAR CITA MÉDICA
            </h2>
          </div>
        </div>
        <button
          type="button"
          className="p-2 border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/50 transition-all"
          onClick={onClose}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
            INFORMACIÓN DEL PACIENTE
          </h3>
          <div className="relative">
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Buscar paciente..."
              className="w-full bg-black/40 border border-white/10 p-3 text-sm text-white rounded focus:border-emerald-500/50 outline-none relative z-10"
            />
            {patientSearch && (
              <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-white/10 max-h-60 overflow-y-auto rounded shadow-lg" style={{ top: '100%', left: 0 }}>
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="p-3 hover:bg-white/10 cursor-pointer text-white text-sm"
                  >
                    {patient.full_name} - {patient.national_id}
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedPatient && (
            <div className="mt-2 text-emerald-400 text-sm">
              ✓ {selectedPatient.full_name} seleccionado
            </div>
          )}
          {errors.patient && (
            <div className="mt-1 text-red-400 text-xs">{errors.patient}</div>
          )}
          {/* ✅ NUEVO: Botón para agregar nuevo paciente */}
          <button
            type="button"
            onClick={() => setShowNewPatientModal(true)}
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm mt-2"
          >
            <UserPlusIcon className="w-4 h-4" />
            Crear nuevo paciente
          </button>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
            SERVICIOS
          </h3>
          
          <div className="relative mb-4">
            <input
              type="text"
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              placeholder="Buscar servicios..."
              className="w-full bg-black/40 border border-white/10 p-3 text-sm text-white rounded focus:border-emerald-500/50 outline-none relative z-10"
            />
            {serviceSearch.length >= 2 && (
              <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-white/10 max-h-60 overflow-y-auto rounded shadow-lg" style={{ top: '100%', left: 0 }}>
                {Object.entries(groupedServices).map(([category, services]) => (
                  <div key={category}>
                    <div className="px-3 py-2 bg-white/5 text-xs font-bold text-white/60 uppercase">
                      {category}
                    </div>
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => handleAddService(service as DoctorService)}
                        className="p-3 hover:bg-white/10 cursor-pointer text-white text-sm flex justify-between items-center"
                      >
                        <div>
                          <div>{service.name}</div>
                          <div className="text-white/60 text-xs">
                            {service.duration_minutes} min
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400">${service.price_usd.toFixed(2)}</div>
                          {service.price_ves && (
                            <div className="text-yellow-400 text-xs">
                              Bs. {service.price_ves.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {selectedServices.length > 0 && (
            <div className="space-y-2">
              {selectedServices.map((selected) => (
                <div
                  key={selected.service.id}
                  className="flex items-center justify-between p-2 bg-black/30 border border-white/5 rounded"
                >
                  <div className="flex-1">
                    <div className="text-white text-sm">{selected.service.name}</div>
                    <div className="text-white/60 text-xs">{selected.service.code}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded">
                      <button
                        type="button"
                        onClick={() => handleServiceQuantity(selected.service.id, -1)}
                        className="p-1 hover:bg-white/10 text-white"
                      >
                        -
                      </button>
                      <span className="px-2 text-white text-sm">{selected.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleServiceQuantity(selected.service.id, 1)}
                        className="p-1 hover:bg-white/10 text-white"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <div className="text-emerald-400 text-sm">
                        ${(selected.service.price_usd * selected.quantity).toFixed(2)}
                      </div>
                      {selected.service.price_ves && (
                        <div className="text-yellow-400 text-xs">
                          Bs. {(selected.service.price_ves * selected.quantity).toFixed(2)}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(selected.service.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-white/60 text-sm">Total:</span>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold text-lg">
                    ${totalAmount.toFixed(2)}
                  </div>
                  {bcvRate?.rate && (
                    <div className="text-yellow-400 text-sm">
                      Bs. {(totalAmount * bcvRate.rate).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {errors.services && (
            <div className="mt-1 text-red-400 text-xs">{errors.services}</div>
          )}
        </div>
        
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
            FECHA DE LA CITA
          </h3>
          <input
            type="date"
            name="appointment_date"
            value={form.appointment_date}
            onChange={handleChange}
            className="w-full bg-black/40 border border-white/10 p-3 text-sm text-white rounded focus:border-emerald-500/50 outline-none"
          />
          {errors.appointment_date && (
            <div className="mt-1 text-red-400 text-xs">{errors.appointment_date}</div>
          )}
        </div>
        
        {/* ✅ NUEVO: Campo de hora con filtros de horarios */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
            HORA DE LA CITA
          </h3>
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            disabled={!availableSlots.length}
            className="w-full bg-black/40 border border-white/10 p-3 text-sm text-white rounded focus:border-emerald-500/50 outline-none"
          >
            <option value="">Seleccionar hora...</option>
            {availableSlots.map(slot => (
              <option key={slot.time} value={slot.time}>
                {slot.label}
              </option>
            ))}
          </select>
          {!availableSlots.length && selectedServiceId && (
            <div className="text-[10px] text-amber-400">
              No hay horarios disponibles para el servicio seleccionado en este día.
            </div>
          )}
          {errors.appointment_time && (
            <div className="mt-1 text-red-400 text-xs">{errors.appointment_time}</div>
          )}
        </div>
      </div>
      
      <div className="px-6 py-3 bg-white/5 border-t border-white/10 flex justify-between items-center">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 bg-white/5 text-white/60 text-sm font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 bg-emerald-600 text-white text-sm font-bold uppercase tracking-wider hover:bg-emerald-500 transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : "Crear Cita"}
        </button>
      </div>
      {submitError && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-300 text-sm rounded">
          Error: {submitError}
        </div>
      )}
      
      {/* ✅ CORREGIDO: NewPatientModal con props requeridas */}
      {showNewPatientModal && (
        <NewPatientModal 
          open={showNewPatientModal}
          onClose={() => setShowNewPatientModal(false)}
          onCreated={() => {
            setShowNewPatientModal(false);
            refetch(); // Recargar lista de pacientes
          }}
        />
      )}
    </form>
  );
}