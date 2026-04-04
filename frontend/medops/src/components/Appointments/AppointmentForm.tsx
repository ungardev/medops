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
import InteractiveCalendar from "@/components/Appointments/InteractiveCalendar";
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
  preselectedServiceId?: number;
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
  price_usd: number | string | null;
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
export default function AppointmentForm({ date, preselectedServiceId, onClose, onSubmit }: Props) {
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
  
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(preselectedServiceId || null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(date || null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  const { data, isLoading: isLoadingPatients, isError: isErrorPatients, refetch } = usePatients(1, 100);
  const patientList: Patient[] = data?.results ?? [];
  
  const { data: categories = [] } = useServiceCategories();
  const { data: serviceResults = [], isFetching: isFetchingServices } = useDoctorServicesSearch(serviceSearch);
  
  const institutionId = activeInstitution?.id ?? 0;
  const { data: serviceSchedules = [] } = useAllServiceSchedules(institutionId);
  
  const formatPrice = (price: any): string => {
    if (price === null || price === undefined || price === "") return "N/A";
    const num = parseFloat(String(price));
    return isNaN(num) ? "N/A" : num.toFixed(2);
  };
  const safePriceToNumber = (price: any): number => {
    if (price === null || price === undefined || price === "") return 0;
    const num = parseFloat(String(price));
    return isNaN(num) ? 0 : num;
  };
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
      const cat = item.category_name || "Otros";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({
        id: item.id,
        code: item.code,
        name: item.name,
        price_usd: safePriceToNumber(item.price_usd),
        price_ves: bcvRate ? convertUSDToVES(safePriceToNumber(item.price_usd), bcvRate) : undefined,
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
    if (selectedDate) {
      setForm(prev => ({
        ...prev,
        appointment_date: selectedDate.toISOString().slice(0, 10)
      }));
    }
  }, [selectedDate]);
  
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
      price_usd: safePriceToNumber(service.price_usd),
      price_ves: bcvRate ? convertUSDToVES(safePriceToNumber(service.price_usd), bcvRate) : undefined,
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
    
    setSelectedServiceId(service.id);
    
    setServiceSearch("");
    setHasChanges(true);
    setTouched(prev => ({ ...prev, services: true }));
    if (errors.services) setErrors(prev => ({ ...prev, services: undefined }));
  };
  
  const handleRemoveService = (serviceId: number | string) => {
    setSelectedServices(prev => prev.filter(s => s.service.id !== serviceId));
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
    (sum, s) => sum + (safePriceToNumber(s.service.price_usd) * s.quantity),
    0
  );
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ patient: true, services: true, appointment_date: true });
    
    const newErrors: FormErrors = {};
    if (!selectedPatient) newErrors.patient = "Seleccione un paciente";
    if (selectedServices.length === 0) newErrors.services = "Agregue al menos un servicio";
    if (!selectedDate) newErrors.appointment_date = "Seleccione una fecha";
    if (!selectedTime) newErrors.appointment_time = "Seleccione una hora";
    
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
        start_time: selectedTime,
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
      setSubmitError(err?.message || "Error al crear la cita");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/15 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-white/15 bg-white/5 rounded-lg">
            <CalendarIcon className="h-5 w-5 text-white/50" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-medium text-white/40 uppercase tracking-wider">
              Nueva Cita
            </span>
            <h2 className="text-[14px] font-semibold text-white">
              Crear Cita Médica
            </h2>
          </div>
        </div>
        <button
          type="button"
          className="p-2 border border-white/15 bg-white/5 text-white/40 hover:text-red-400 hover:border-red-500/25 transition-all rounded-lg"
          onClick={onClose}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <h3 className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
            Paciente
          </h3>
          <div className="relative">
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Buscar paciente..."
              className="w-full bg-white/5 border border-white/15 p-3 text-[12px] text-white/80 rounded-lg focus:border-emerald-500/50 outline-none placeholder:text-white/30"
            />
            {patientSearch && (
              <div className="absolute z-50 w-full mt-1 bg-[#1a1a1b] border border-white/15 max-h-60 overflow-y-auto rounded-lg shadow-lg">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handlePatientSelect(patient)}
                    className="p-3 hover:bg-white/5 cursor-pointer text-white/80 text-[12px] border-b border-white/5 last:border-0"
                  >
                    {patient.full_name} - {patient.national_id}
                  </div>
                ))}
              </div>
            )}
          </div>
          {selectedPatient && (
            <div className="mt-2 text-emerald-400 text-[11px]">
              ✓ {selectedPatient.full_name} seleccionado
            </div>
          )}
          {errors.patient && (
            <div className="mt-1 text-red-400 text-[10px]">{errors.patient}</div>
          )}
          <button
            type="button"
            onClick={() => setShowNewPatientModal(true)}
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-[11px] mt-2"
          >
            <UserPlusIcon className="w-4 h-4" />
            Crear nuevo paciente
          </button>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
            Servicios
          </h3>
          
          <div className="relative mb-4">
            <input
              type="text"
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              placeholder="Buscar servicios..."
              className="w-full bg-white/5 border border-white/15 p-3 text-[12px] text-white/80 rounded-lg focus:border-emerald-500/50 outline-none placeholder:text-white/30"
            />
            {serviceSearch.length >= 2 && (
              <div className="absolute z-50 w-full mt-1 bg-[#1a1a1b] border border-white/15 max-h-60 overflow-y-auto rounded-lg shadow-lg">
                {Object.entries(groupedServices).map(([category, services]) => (
                  <div key={category}>
                    <div className="px-3 py-2 bg-white/5 text-[10px] font-medium text-white/40 uppercase">
                      {category}
                    </div>
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => handleAddService(service as DoctorService)}
                        className="p-3 hover:bg-white/5 cursor-pointer text-white/80 text-[12px] flex justify-between items-center border-b border-white/5 last:border-0"
                      >
                        <div>
                          <div>{service.name}</div>
                          <div className="text-white/30 text-[10px]">
                            {service.duration_minutes} min
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400">${formatPrice(service.price_usd)}</div>
                          {service.price_ves && (
                            <div className="text-amber-400/60 text-[10px]">
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
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="text-white/80 text-[12px]">{selected.service.name}</div>
                    <div className="text-white/30 text-[10px]">{selected.service.code}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white/5 border border-white/15 rounded-lg">
                      <button
                        type="button"
                        onClick={() => handleServiceQuantity(selected.service.id, -1)}
                        className="p-1.5 hover:bg-white/10 text-white/60 rounded-l-lg"
                      >
                        -
                      </button>
                      <span className="px-2 text-white/80 text-[12px]">{selected.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleServiceQuantity(selected.service.id, 1)}
                        className="p-1.5 hover:bg-white/10 text-white/60 rounded-r-lg"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <div className="text-emerald-400 text-[12px]">
                        ${formatPrice(safePriceToNumber(selected.service.price_usd) * selected.quantity)}
                      </div>
                      {selected.service.price_ves && (
                        <div className="text-amber-400/60 text-[10px]">
                          Bs. {(selected.service.price_ves * selected.quantity).toFixed(2)}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(selected.service.id)}
                      className="text-red-400/60 hover:text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <span className="text-white/50 text-[12px]">Total:</span>
                <div className="text-right">
                  <div className="text-emerald-400 font-semibold text-[16px]">
                    ${formatPrice(totalAmount)}
                  </div>
                  {bcvRate?.rate && (
                    <div className="text-amber-400/60 text-[11px]">
                      Bs. {(totalAmount * bcvRate.rate).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {errors.services && (
            <div className="mt-1 text-red-400 text-[10px]">{errors.services}</div>
          )}
        </div>
        
        <div className="space-y-3">
          <h3 className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
            Fecha y Hora
          </h3>
          
          <InteractiveCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            serviceSchedules={serviceSchedules}
            selectedServiceId={selectedServiceId}
            availableSlots={availableSlots}
            onTimeSelect={setSelectedTime}
            selectedTime={selectedTime}
          />
          
          {errors.appointment_date && (
            <div className="mt-1 text-red-400 text-[10px]">{errors.appointment_date}</div>
          )}
          {errors.appointment_time && (
            <div className="mt-1 text-red-400 text-[10px]">{errors.appointment_time}</div>
          )}
        </div>
      </div>
      
      <div className="px-6 py-4 bg-white/5 border-t border-white/15 flex justify-between items-center gap-3 rounded-b-lg">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 bg-white/5 text-white/60 text-[11px] font-medium hover:bg-white/10 transition-all rounded-lg"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-2.5 bg-emerald-500/15 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/25 transition-all disabled:opacity-50 border border-emerald-500/25 rounded-lg"
        >
          {isSubmitting ? "Guardando..." : "Crear Cita"}
        </button>
      </div>
      {submitError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] rounded-lg mx-6">
          Error: {submitError}
        </div>
      )}
      
      {showNewPatientModal && (
        <NewPatientModal 
          open={showNewPatientModal}
          onClose={() => setShowNewPatientModal(false)}
          onCreated={() => {
            setShowNewPatientModal(false);
            refetch();
          }}
        />
      )}
    </form>
  );
}