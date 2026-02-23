// src/components/Appointments/AppointmentForm.tsx
import React, { useState, useEffect, useMemo } from "react";
import { AppointmentInput } from "types/appointments";
import type { Patient } from "types/patients";
import type { BillingItem, BillingCategory } from "types/billing";
import { usePatients } from "hooks/patients/usePatients";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { useBillingCategories } from "@/hooks/billing/useBillingCategories";
import { useBillingItemsSearch } from "@/hooks/billing/useBillingItems";
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
}
interface SelectedService {
  billingItem: BillingItem;
  quantity: number;
}
export default function AppointmentForm({ date, onClose, onSubmit }: Props) {
  const { institutions, activeInstitution } = useInstitutions();
  const { data: doctorConfig } = useDoctorConfig();
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  
  // Pacientes
  const { data, isLoading: isLoadingPatients, isError: isErrorPatients, refetch } = usePatients(1, 100);
  const patientList: Patient[] = data?.results ?? [];
  
  // Servicios del catálogo
  const { data: categories = [] } = useBillingCategories();
  const { data: serviceResults = [], isFetching: isFetchingServices } = useBillingItemsSearch(serviceSearch);
  
  // Filtrar pacientes por búsqueda
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patientList;
    const search = patientSearch.toLowerCase();
    return patientList.filter((p) => 
      p.full_name?.toLowerCase().includes(search) ||
      p.national_id?.toLowerCase().includes(search) ||
      p.email?.toLowerCase().includes(search)
    );
  }, [patientList, patientSearch]);
  
  // Agrupar servicios por categoría
  const groupedServices = useMemo(() => {
    const groups: Record<string, BillingItem[]> = {};
    serviceResults.forEach(item => {
      const cat = item.category_name || "OTROS";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [serviceResults]);
  const institutionId = activeInstitution?.id ?? 0;
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
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setForm(prev => ({ ...prev, patient: patient.id }));
    setPatientSearch("");
    setHasChanges(true);
    setTouched(prev => ({ ...prev, patient: true }));
    if (errors.patient) setErrors(prev => ({ ...prev, patient: undefined }));
  };
  const handleAddService = (item: BillingItem) => {
    const existing = selectedServices.find(s => s.billingItem.id === item.id);
    if (existing) {
      setSelectedServices(prev => prev.map(s => 
        s.billingItem.id === item.id 
          ? { ...s, quantity: s.quantity + 1 }
          : s
      ));
    } else {
      setSelectedServices(prev => [...prev, { billingItem: item, quantity: 1 }]);
    }
    setServiceSearch("");
    setHasChanges(true);
    setTouched(prev => ({ ...prev, services: true }));
    if (errors.services) setErrors(prev => ({ ...prev, services: undefined }));
  };
  const handleRemoveService = (itemId: number) => {
    setSelectedServices(prev => prev.filter(s => s.billingItem.id !== itemId));
    setHasChanges(true);
  };
  const handleServiceQuantity = (itemId: number, delta: number) => {
    setSelectedServices(prev => prev.map(s => 
      s.billingItem.id === itemId 
        ? { ...s, quantity: Math.max(1, s.quantity + delta) }
        : s
    ));
    setHasChanges(true);
  };
  const totalAmount = selectedServices.reduce(
    (sum, s) => sum + (Number(s.billingItem.unit_price) * s.quantity),
    0
  );
  // =====================================================
  // ✅ FIX: handleSubmit - Ahora envía los servicios
  // =====================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ patient: true, services: true, appointment_date: true });
    
    const newErrors: FormErrors = {};
    if (!selectedPatient) newErrors.patient = "REQUIRED_FIELD: Select patient";
    if (selectedServices.length === 0) newErrors.services = "REQUIRED_FIELD: Add at least one service";
    if (!form.appointment_date) newErrors.appointment_date = "REQUIRED_FIELD: Select date";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // ✅ CONSTRUIR PAYLOAD CON SERVICIOS DEL CATÁLOGO
      const payload: AppointmentInput = {
        ...form,
        patient: selectedPatient!.id,
        expected_amount: totalAmount.toFixed(2),
        // ✅ ENVÍAR SERVICIOS SELECCIONADOS AL BACKEND
        services: selectedServices.map(s => ({
          billing_item_id: s.billingItem.id,
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-2xl w-full bg-[#0a0a0b] border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black/40 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Operation_Initialization</span>
              <h2 className="text-lg font-black text-white uppercase">New_Appointment</h2>
            </div>
          </div>
          <button type="button" className="p-2 hover:bg-red-500/20 text-white/40 hover:text-red-400" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {submitError && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 flex items-center gap-2">
            <ExclamationCircleIcon className="w-4 h-4 text-red-400" />
            <span className="text-[10px] text-red-400 font-mono uppercase">{submitError}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* PATIENT SELECTION */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
              <UserIcon className="w-3 h-3" /> Target_Subject_Identity
            </label>
            
            {selectedPatient ? (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserCircleIcon className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="text-sm font-bold text-white">{selectedPatient.full_name}</p>
                    <span className="text-[9px] font-mono text-white/50">
                      {selectedPatient.national_id || 'SIN_CÉDULA'}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => { setSelectedPatient(null); setForm(p => ({ ...p, patient: 0 })); }} className="text-white/40 hover:text-red-400">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="SEARCH_PATIENT_BY_NAME_OR_DOC..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 pl-9 pr-3 py-2 text-sm font-mono text-white placeholder:text-white/20 focus:border-blue-500/50"
                  />
                </div>
                
                {patientSearch && filteredPatients.length > 0 && (
                  <div className="bg-black/80 border border-white/10 max-h-48 overflow-y-auto">
                    {filteredPatients.slice(0, 8).map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePatientSelect(p)}
                        className="w-full p-3 flex items-center gap-3 hover:bg-white/5 text-left"
                      >
                        <UserCircleIcon className="w-5 h-5 text-white/30" />
                        <div className="flex-1">
                          <p className="text-sm text-white font-bold">{p.full_name}</p>
                          <span className="text-[9px] text-white/40">{p.national_id}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setShowNewPatientModal(true)} className="text-[10px] text-blue-400 hover:text-blue-300">
                    + REGISTER_NEW_SUBJECT
                  </button>
                </div>
              </>
            )}
            
            {errors.patient && touched.patient && (
              <span className="text-[9px] text-red-400 flex items-center gap-1">
                <ExclamationCircleIcon className="w-3 h-3" /> {errors.patient}
              </span>
            )}
          </div>
          
          {/* INSTITUTION */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
              <BuildingOfficeIcon className="w-3 h-3" /> Medical_Center
            </label>
            <select
              name="institution"
              value={form.institution || ""}
              onChange={(e) => setForm(p => ({ ...p, institution: Number(e.target.value) || 0 }))}
              className="w-full bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono text-white"
            >
              <option value="" className="bg-gray-900">SELECT_INSTITUTION</option>
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id} className="bg-gray-900">
                  {inst.name.toUpperCase()} {activeInstitution?.id === inst.id ? "● ACTIVE" : ""}
                </option>
              ))}
            </select>
          </div>
          
          {/* DOCTOR INFO */}
          <div className="p-3 bg-white/5 border border-white/10 flex items-center gap-3">
            <UserCircleIcon className="w-6 h-6 text-blue-400" />
            <div>
              <span className="text-[8px] text-white/40 uppercase">Attending_Physician</span>
              <p className="text-sm font-bold text-white">{doctorConfig?.full_name || "NOT_CONFIGURED"}</p>
            </div>
          </div>
          
          {/* SERVICES SELECTION */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
              <BeakerIcon className="w-3 h-3" /> Select_Services
            </label>
            
            {/* Search Services */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="SEARCH_SERVICE_FROM_CATALOG..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 pl-9 pr-3 py-2 text-sm font-mono text-white placeholder:text-white/20 focus:border-blue-500/50"
              />
            </div>
            
            {/* Service Results by Category */}
            {serviceSearch.length >= 2 && Object.keys(groupedServices).length > 0 && (
              <div className="bg-black/80 border border-white/10 max-h-64 overflow-y-auto">
                {Object.entries(groupedServices).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-3 py-2 bg-white/5 text-[9px] font-bold text-white/40 uppercase sticky top-0">
                      {category}
                    </div>
                    {items.slice(0, 5).map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleAddService(item)}
                        className="w-full p-3 flex items-center justify-between hover:bg-white/5 text-left"
                      >
                        <div>
                          <span className="text-sm text-white">{item.name}</span>
                          <span className="text-[9px] text-white/40 ml-2">{item.code}</span>
                        </div>
                        <span className="text-sm font-mono text-emerald-400">${Number(item.unit_price).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
            
            {/* Selected Services */}
            {selectedServices.length > 0 && (
              <div className="space-y-2">
                <div className="text-[9px] text-white/40 uppercase">Selected_Services:</div>
                {selectedServices.map(s => (
                  <div key={s.billingItem.id} className="p-3 bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex-1">
                      <span className="text-sm text-white">{s.billingItem.name}</span>
                      <span className="text-[9px] text-white/40 ml-2">${Number(s.billingItem.unit_price).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleServiceQuantity(s.billingItem.id, -1)} className="w-6 h-6 bg-white/10 hover:bg-white/20 text-white">-</button>
                      <span className="w-8 text-center text-white font-mono">{s.quantity}</span>
                      <button type="button" onClick={() => handleServiceQuantity(s.billingItem.id, 1)} className="w-6 h-6 bg-white/10 hover:bg-white/20 text-white">+</button>
                      <span className="w-20 text-right text-emerald-400 font-mono">
                        ${(Number(s.billingItem.unit_price) * s.quantity).toFixed(2)}
                      </span>
                      <button type="button" onClick={() => handleRemoveService(s.billingItem.id)} className="text-red-400 hover:text-red-300">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between p-3 bg-blue-500/10 border border-blue-500/30">
                  <span className="text-sm font-bold text-white uppercase">Total_Amount</span>
                  <span className="text-lg font-bold text-emerald-400">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
            
            {errors.services && touched.services && (
              <span className="text-[9px] text-red-400 flex items-center gap-1">
                <ExclamationCircleIcon className="w-3 h-3" /> {errors.services}
              </span>
            )}
          </div>
          
          {/* DATE */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
              <CalendarIcon className="w-3 h-3" /> Execution_Date
            </label>
            <input
              type="date"
              name="appointment_date"
              value={form.appointment_date}
              onChange={(e) => setForm(p => ({ ...p, appointment_date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono text-white [color-scheme:dark]"
              style={{ colorScheme: 'dark' }}
            />
            {errors.appointment_date && touched.appointment_date && (
              <span className="text-[9px] text-red-400">{errors.appointment_date}</span>
            )}
          </div>
          
          {/* NOTES */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
              <DocumentTextIcon className="w-3 h-3" /> Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2}
              placeholder="OBSERVATIONS..."
              className="w-full bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono text-white placeholder:text-white/20"
            />
          </div>
          
          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2 text-[10px] font-black uppercase text-white/40 hover:text-white">
              Abort
            </button>
            <button type="submit" disabled={isSubmitting} className="px-8 py-2 bg-blue-600 text-white text-[10px] font-black uppercase hover:bg-blue-500 disabled:opacity-50">
              {isSubmitting ? "PROCESSING..." : "Commit_Record"}
            </button>
          </div>
        </form>
        
        {showNewPatientModal && (
          <NewPatientModal
            open={showNewPatientModal}
            onClose={() => { setShowNewPatientModal(false); refetch(); }}
            onCreated={() => { setShowNewPatientModal(false); refetch(); }}
          />
        )}
      </div>
    </div>
  );
}