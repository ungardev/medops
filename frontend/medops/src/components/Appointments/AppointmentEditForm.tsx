// src/components/Appointments/AppointmentEditForm.tsx
import React, { useState, useEffect, useMemo } from "react";
import { AppointmentInput } from "../../types/appointments";
// ✅ CAMBIO: Importar tipo DoctorService en lugar de BillingItem
import type { DoctorService } from "../../types/services";
import { useAppointment } from "../../hooks/appointments";
// ✅ CAMBIO: Importar hooks de services
import { useServiceCategories } from "@/hooks/services/useServiceCategories";
import { useDoctorServicesSearch } from "@/hooks/services/useDoctorServices";
// ✅ NUEVO: Hook para tasa BCV
import { useBCVRate, convertUSDToVES } from "@/hooks/dashboard/useBCVRate";
import { 
  XMarkIcon, 
  PencilSquareIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  TrashIcon,
  BeakerIcon,
  ExclamationCircleIcon,
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
// ✅ NUEVO: Interfaz auxiliar para servicios temporales
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
// ✅ CAMBIO: Tipo SelectedService usa TemporaryService
interface SelectedService {
  service: TemporaryService;
  quantity: number;
}
export default function AppointmentEditForm({ appointmentId, onClose, onSubmit }: Props) {
  // ✅ FIX: Obtener datos completos del appointment
  const { data: appointmentData, isLoading } = useAppointment(appointmentId);
  
  // ✅ NUEVO: Obtener tasa BCV
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
  
  // ✅ CAMBIO: Servicios del catálogo usando hooks de services
  const [serviceSearch, setServiceSearch] = useState("");
  const { data: categories = [] } = useServiceCategories();
  const { data: serviceResults = [] } = useDoctorServicesSearch(serviceSearch);
  
  // ✅ FIX: Estado de servicios seleccionados (usando TemporaryService)
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  
  // ✅ FIX: Actualizar form cuando appointmentData cargue
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
      
      // ✅ FIX: Cargar servicios desde charge_order existente usando TemporaryService
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
            duration_minutes: 30, // Valor predeterminado
            is_active: true,       // Valor predeterminado
            is_visible_global: true // Valor predeterminado
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
            duration_minutes: 30, // Valor predeterminado
            is_active: true,       // Valor predeterminado
            is_visible_global: true // Valor predeterminado
          } as TemporaryService,
          quantity: 1
        }]);
      }
    }
  }, [appointmentData, bcvRate]);
  // ✅ CAMBIO: Agrupar servicios por categoría usando TemporaryService
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
  
  // ✅ CAMBIO: handleAddService usa TemporaryService
  const handleAddService = (service: DoctorService) => {
    // Convertir DoctorService a TemporaryService
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
  
  // ✅ CAMBIO: handleRemoveService usa service.id
  const handleRemoveService = (serviceId: number | string) => {
    setSelectedServices(prev => prev.filter(s => s.service.id !== serviceId));
    setHasChanges(true);
  };
  
  // ✅ CAMBIO: handleServiceQuantity usa service.id
  const handleServiceQuantity = (serviceId: number | string, delta: number) => {
    setSelectedServices(prev => prev.map(s => 
      s.service.id === serviceId 
        ? { ...s, quantity: Math.max(1, s.quantity + delta) }
        : s
    ));
    setHasChanges(true);
  };
  
  // ✅ CAMBIO: Cálculo del total usa price_usd
  const totalAmount = selectedServices.reduce(
    (sum, s) => sum + (Number(s.service.price_usd) * s.quantity),
    0
  );
  
  // =====================================================
  // ✅ FIX: handleSubmit - Ahora envía los servicios con doctor_service_id
  // =====================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ appointment_date: true });
    
    if (!form.appointment_date) {
      setErrors({ appointment_date: "REQUIRED_FIELD: Select date" });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const payload: AppointmentInput = {
        ...form,
        expected_amount: totalAmount.toFixed(2),
        // ✅ ENVÍAR SERVICIOS SELECCIONADOS AL BACKEND (cambio clave: doctor_service_id)
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
      setSubmitError(err?.message || "UPDATE_FAILED");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
        <div className="flex flex-col items-center gap-4">
          <ArrowPathIcon className="w-8 h-8 text-white/40 animate-spin" />
          <span className="text-[10px] font-mono text-white/40 uppercase">Loading_Record...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full bg-[#0a0a0b] border border-white/10 shadow-2xl overflow-hidden">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Información de la Cita Existente */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4" /> Información de la Cita
            </h3>
            <div className="grid grid-cols-2 gap-4 text-white text-sm">
              <div>
                <span className="text-white/60">Paciente:</span>{" "}
                {appointmentData?.patient?.full_name}
              </div>
              <div>
                <span className="text-white/60">Doctor:</span>{" "}
                {appointmentData?.doctor?.full_name}
              </div>
              <div>
                <span className="text-white/60">Fecha Actual:</span>{" "}
                {appointmentData?.appointment_date}
              </div>
              <div>
                <span className="text-white/60">Estado:</span>{" "}
                {appointmentData?.status}
              </div>
            </div>
          </div>
          
          {/* Selección de Servicios (Catálogo) */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <CurrencyDollarIcon className="w-4 h-4" /> Agregar Servicios del Catálogo
            </h3>
            
            {/* Buscador de servicios */}
            <div className="relative mb-4">
              <input
                type="text"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Buscar servicios..."
                className="w-full bg-black/40 border border-white/10 p-3 text-sm text-white rounded focus:border-emerald-500/50 outline-none"
              />
              {serviceSearch.length >= 2 && (
                <div className="absolute z-10 w-full mt-1 bg-[#1a1a1a] border border-white/10 max-h-60 overflow-y-auto rounded shadow-lg">
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
            
            {/* Servicios seleccionados */}
            {selectedServices.length > 0 && (
              <div className="space-y-2">
                {selectedServices.map((selected) => (
                  <div
                    key={selected.service.id}
                    className="flex items-center justify-between p-2 bg-black/30 border border-white/5 rounded"
                  >
                    <div className="flex-1">
                      <div className="text-white text-sm">{selected.service.name}</div>
                      <div className="text-white/60 text-xs">
                        {selected.service.code} • {selected.service.duration_minutes} min
                      </div>
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
                    {bcvRate && (
                      <div className="text-yellow-400 text-sm">
                        Bs. {(totalAmount * bcvRate.rate).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Fecha de la Cita */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> Nueva Fecha de la Cita
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
          
          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
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
              {isSubmitting ? "Guardando..." : "Actualizar Cita"}
            </button>
          </div>
          
          {submitError && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 text-red-300 text-sm rounded">
              Error: {submitError}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}