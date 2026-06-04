// src/components/Appointments/AppointmentEditForm.tsx
import React, { useState, useEffect, useMemo } from "react";
import { AppointmentInput } from "../../types/appointments";
import type { DoctorService } from "../../types/services";
import { useAppointment } from "../../hooks/appointments";
import { useServiceCategories } from "@/hooks/services/useServiceCategories";
import { useDoctorServicesSearch } from "@/hooks/services/useDoctorServices";
import { useBCVRate, convertUSDToVES } from "@/hooks/dashboard/useBCVRate";
import { 
  XMarkIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  TrashIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";

interface Props {
  appointmentId: number;
  onClose: () => void;
  onSubmit?: (id: number, data: AppointmentInput) => Promise<void> | void;
}

interface FormErrors {
  appointment_date?: string;
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

export default function AppointmentEditForm({ appointmentId, onClose, onSubmit }: Props) {
  const { data: appointmentData, isLoading } = useAppointment(appointmentId);
  const { data: bcvRate } = useBCVRate();
  
  const [form, setForm] = useState<AppointmentInput>({
    patient: 0,
    institution: 0,
    doctor: 0,
    appointment_date: "",
    appointment_type: "general",
    expected_amount: "",
    notes: "",
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [serviceSearch, setServiceSearch] = useState("");
  const { data: serviceResults = [] } = useDoctorServicesSearch(serviceSearch);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  
  useEffect(() => {
    if (appointmentData) {
      setForm({
        patient: appointmentData.patient?.id ?? 0,
        institution: appointmentData.institution?.id ?? 0,
        doctor: appointmentData.doctor?.id ?? 0,
        appointment_date: appointmentData.appointment_date?.slice(0, 10) ?? "",
        appointment_type: appointmentData.appointment_type ?? "general",
        expected_amount: String(appointmentData.expected_amount ?? ""),
        notes: appointmentData.notes ?? "",
      });
      
      const items = appointmentData.charge_order?.items ?? [];
      if (items.length > 0) {
        setSelectedServices(items.map((item: any) => ({
          service: {
            id: item.id,
            code: item.code,
            name: item.description,
            price_usd: item.unit_price,
            price_ves: bcvRate ? convertUSDToVES(item.unit_price, bcvRate) : undefined,
            category: null,
            category_name: undefined,
            doctor: appointmentData.doctor?.id ?? 0,
            duration_minutes: 30,
            is_active: true,
            is_visible_global: true
          } as TemporaryService,
          quantity: item.qty
        })));
      } else if (appointmentData.expected_amount) {
        setSelectedServices([{
          service: {
            id: 0,
            code: 'CONSULT',
            name: 'Consulta',
            price_usd: Number(appointmentData.expected_amount),
            price_ves: bcvRate ? convertUSDToVES(Number(appointmentData.expected_amount), bcvRate) : undefined,
            category: null,
            category_name: undefined,
            doctor: appointmentData.doctor?.id ?? 0,
            duration_minutes: 30,
            is_active: true,
            is_visible_global: true
          } as TemporaryService,
          quantity: 1
        }]);
      }
    }
  }, [appointmentData, bcvRate]);
  
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
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "patient") return;
    setForm(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
    setTouched(prev => ({ ...prev, [name]: true }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
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
    setServiceSearch("");
    setHasChanges(true);
  };
  
  const handleRemoveService = (serviceId: number | string) => {
    setSelectedServices(prev => prev.filter(s => s.service.id !== serviceId));
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
    setTouched({ appointment_date: true });
    
    if (!form.appointment_date) {
      setErrors({ appointment_date: "CAMPO_REQUERIDO: Seleccione fecha" });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const payload: AppointmentInput = {
        ...form,
        expected_amount: totalAmount.toFixed(2),
        services: selectedServices.map(s => ({
          doctor_service_id: Number(s.service.id),
          qty: s.quantity,
        })),
      };
      
      if (onSubmit && appointmentId) {
        await onSubmit(appointmentId, payload);
      }
      
      setHasChanges(false);
      onClose();
    } catch (err: any) {
      console.error("Update error:", err);
      setSubmitError(err?.message || "ERROR_AL_ACTUALIZAR");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
        <div className="flex flex-col items-center gap-4">
          <ArrowPathIcon className="w-8 h-8 text-white/40 animate-spin" />
          <span className="text-sm font-mono text-white/40 uppercase">Cargando...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full bg-[#0a0a0b] border border-white/10 shadow-2xl overflow-hidden rounded-xl">
        
        <div className="flex justify-between items-center px-6 py-5 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-2.5 border border-white/20 text-white/60 bg-white/5 rounded-xl">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
                EDITAR CITA
              </span>
              <h2 className="text-lg font-bold text-white uppercase">
                #{appointmentId?.toString().padStart(6, '0') || '000000'}
              </h2>
            </div>
          </div>
          
          <button
            type="button"
            className="p-2.5 border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/50 transition-all rounded-xl"
            onClick={onClose}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">
              INFORMACIÓN DEL PACIENTE
            </h3>
            <div className="grid grid-cols-2 gap-5 text-white text-sm bg-white/5 p-5 border border-white/10 rounded-xl">
              <div>
                <span className="text-xs text-white/40 uppercase">Nombre</span>
                <p className="mt-1">{appointmentData?.patient?.full_name}</p>
              </div>
              <div>
                <span className="text-xs text-white/40 uppercase">Doctor</span>
                <p className="mt-1">{appointmentData?.doctor?.full_name}</p>
              </div>
              <div>
                <span className="text-xs text-white/40 uppercase">Fecha Actual</span>
                <p className="mt-1">{appointmentData?.appointment_date}</p>
              </div>
              <div>
                <span className="text-xs text-white/40 uppercase">Estado</span>
                <p className="mt-1 uppercase">{appointmentData?.status}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">
              SERVICIOS
            </h3>
            
            <div className="relative">
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Buscar servicios..."
                className="w-full bg-black/40 border border-white/10 p-4 text-sm text-white rounded-xl focus:border-emerald-500/50 outline-none"
              />
              {serviceSearch.length >= 2 && (
                <div className="absolute z-10 w-full mt-2 bg-[#1a1a1a] border border-white/10 max-h-60 overflow-y-auto rounded-xl shadow-lg">
                  {Object.entries(groupedServices).map(([category, services]) => (
                    <div key={category}>
                      <div className="px-4 py-3 bg-white/5 text-sm font-bold text-white/60 uppercase">
                        {category}
                      </div>
                      {services.map((service) => (
                        <div
                          key={service.id}
                          onClick={() => handleAddService(service as DoctorService)}
                          className="p-4 hover:bg-white/10 cursor-pointer text-white text-sm flex justify-between items-center"
                        >
                          <div>
                            <div>{service.name}</div>
                            <div className="text-white/60 text-sm mt-1">
                              {service.duration_minutes} min
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-400">${service.price_usd.toFixed(2)}</div>
                            {service.price_ves && (
                              <div className="text-amber-400 text-sm mt-1">
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
              <div className="space-y-3">
                {selectedServices.map((selected) => (
                  <div
                    key={selected.service.id}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <div className="flex-1">
                      <div className="text-white text-sm">{selected.service.name}</div>
                      <div className="text-white/60 text-sm mt-1">
                        {selected.service.code} • {selected.service.duration_minutes} min
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleServiceQuantity(selected.service.id, -1)}
                          className="p-2 hover:bg-white/10 text-white"
                        >
                          -
                        </button>
                        <span className="px-3 text-white text-sm">{selected.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleServiceQuantity(selected.service.id, 1)}
                          className="p-2 hover:bg-white/10 text-white"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <div className="text-emerald-400 text-sm">
                          ${(selected.service.price_usd * selected.quantity).toFixed(2)}
                        </div>
                        {selected.service.price_ves && (
                          <div className="text-amber-400 text-sm mt-1">
                            Bs. {(selected.service.price_ves * selected.quantity).toFixed(2)}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveService(selected.service.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                  <span className="text-white/60 text-sm">Total:</span>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold text-lg">
                      ${totalAmount.toFixed(2)}
                    </div>
                    {bcvRate && (
                      <div className="text-amber-400 text-sm mt-1">
                        Bs. {(totalAmount * bcvRate.rate).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">
              NUEVA FECHA
            </h3>
            <input
              type="date"
              name="appointment_date"
              value={form.appointment_date}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 p-4 text-sm text-white rounded-xl focus:border-emerald-500/50 outline-none"
            />
            {errors.appointment_date && (
              <div className="text-red-400 text-sm">{errors.appointment_date}</div>
            )}
          </div>
          
          <div className="flex gap-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 text-white/60 text-sm font-bold uppercase tracking-wider hover:bg-white/10 transition-all rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-emerald-600 text-white text-sm font-bold uppercase tracking-wider hover:bg-emerald-500 transition-all disabled:opacity-50 rounded-xl"
            >
              {isSubmitting ? "Guardando..." : "Actualizar Cita"}
            </button>
          </div>
          
          {submitError && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 text-red-300 text-sm rounded-xl">
              Error: {submitError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}