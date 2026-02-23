// src/components/Appointments/AppointmentEditForm.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Appointment, AppointmentInput } from "../../types/appointments";
import type { BillingItem } from "../../types/billing";
import { useBillingCategories } from "@/hooks/billing/useBillingCategories";
import { useBillingItemsSearch } from "@/hooks/billing/useBillingItems";
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
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";
interface Props {
  appointment: Appointment;
  onClose: () => void;
  onSubmit?: (id: number, data: AppointmentInput) => Promise<void> | void;
}
interface FormErrors {
  appointment_date?: string;
}
interface SelectedService {
  billingItem: BillingItem;
  quantity: number;
}
export default function AppointmentEditForm({ appointment, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<AppointmentInput>({
    patient: appointment?.patient?.id ?? 0,
    institution: appointment?.institution?.id ?? 0,
    doctor: appointment?.doctor?.id ?? 0,
    appointment_date: appointment?.appointment_date ?? "",
    appointment_type: appointment?.appointment_type ?? "general",
    expected_amount: String(appointment?.expected_amount ?? ""),
    notes: appointment?.notes ?? "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Servicios del catálogo
  const [serviceSearch, setServiceSearch] = useState("");
  const { data: categories = [] } = useBillingCategories();
  const { data: serviceResults = [] } = useBillingItemsSearch(serviceSearch);
  
  // Servicios seleccionados (inicializar con expected_amount si existe)
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(() => {
    // Si hay expected_amount, crear un servicio genérico
    if (appointment?.expected_amount) {
      return [{
        billingItem: {
          id: 0,
          code: 'CONSULT',
          name: 'Consulta',
          unit_price: Number(appointment.expected_amount),
          category: null,
        } as BillingItem,
        quantity: 1
      }];
    }
    return [];
  });
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
      };
      
      if (onSubmit && appointment?.id) {
        await onSubmit(appointment.id, payload);
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
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <div className="max-w-2xl w-full bg-[#0a0a0b] border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <PencilSquareIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">Record_Modification</span>
              <h2 className="text-lg font-black text-white uppercase">
                Edit_Entry <span className="text-white/40 font-mono ml-2">#ID-{appointment?.id}</span>
              </h2>
            </div>
          </div>
          <button type="button" className="p-2 hover:bg-red-500/20 text-white/40 hover:text-red-400" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {submitError && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 flex items-center gap-2">
            <ExclamationCircleIcon className="w-4 h-4 text-red-400" />
            <span className="text-[10px] text-red-400 font-mono">{submitError}</span>
          </div>
        )}
        <div className="p-3 mx-6 mt-4 bg-blue-500/5 border-l-2 border-blue-500/50">
          <p className="text-[9px] text-blue-400/80">SYSTEM_NOTICE: Subject identity locked. Services and date can be modified.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* PATIENT (LOCKED) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
              <UserIcon className="w-3 h-3" /> Locked_Subject
            </label>
            <div className="p-3 bg-white/5 border border-white/10 flex items-center gap-3 opacity-80">
              <UserCircleIcon className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-sm font-bold text-white">{appointment?.patient?.full_name || "UNKNOWN"}</p>
                <span className="text-[9px] text-white/40">ID: {appointment?.patient?.id} | DOC: {appointment?.patient?.national_id || "N/A"}</span>
              </div>
            </div>
          </div>
          {/* INSTITUTION (LOCKED) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
              <BuildingOfficeIcon className="w-3 h-3" /> Medical_Center
            </label>
            <div className="p-3 bg-white/5 border border-white/10 flex items-center gap-3 opacity-60">
              <BuildingOfficeIcon className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm font-bold text-white">{appointment?.institution?.name || "UNKNOWN"}</p>
                <span className="text-[9px] text-white/40">TAX_ID: {appointment?.institution?.tax_id || "N/A"}</span>
              </div>
            </div>
          </div>
          {/* DOCTOR */}
          <div className="p-3 bg-white/5 border border-white/10 flex items-center gap-3">
            <UserCircleIcon className="w-6 h-6 text-blue-400" />
            <div>
              <span className="text-[8px] text-white/40 uppercase">Attending_Physician</span>
              <p className="text-sm font-bold text-white">{appointment?.doctor?.full_name || "NOT_CONFIGURED"}</p>
            </div>
          </div>
          {/* SERVICES */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
              <BeakerIcon className="w-3 h-3" /> Modify_Services
            </label>
            
            <div className="relative">
              <input
                type="text"
                placeholder="ADD_SERVICE_FROM_CATALOG..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 pl-9 pr-3 py-2 text-sm font-mono text-white"
              />
            </div>
            
            {serviceSearch.length >= 2 && Object.keys(groupedServices).length > 0 && (
              <div className="bg-black/80 border border-white/10 max-h-40 overflow-y-auto">
                {Object.entries(groupedServices).map(([category, items]) => (
                  <div key={category}>
                    <div className="px-3 py-1 bg-white/5 text-[8px] text-white/40 uppercase sticky top-0">{category}</div>
                    {items.slice(0, 3).map(item => (
                      <button type="button" onClick={() => handleAddService(item)} className="w-full p-2 flex justify-between hover:bg-white/5 text-sm">
                        <span className="text-white">{item.name}</span>
                        <span className="text-emerald-400">${Number(item.unit_price).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
            
            {selectedServices.length > 0 && (
              <div className="space-y-1">
                {selectedServices.map(s => (
                  <div key={s.billingItem.id} className="p-2 bg-white/5 border border-white/10 flex justify-between items-center">
                    <span className="text-sm text-white">{s.billingItem.name}</span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleServiceQuantity(s.billingItem.id, -1)} className="w-5 h-5 bg-white/10 text-white">-</button>
                      <span className="w-6 text-center text-white">{s.quantity}</span>
                      <button type="button" onClick={() => handleServiceQuantity(s.billingItem.id, 1)} className="w-5 h-5 bg-white/10 text-white">+</button>
                      <span className="text-emerald-400 w-16 text-right">${(Number(s.billingItem.unit_price) * s.quantity).toFixed(2)}</span>
                      <button type="button" onClick={() => handleRemoveService(s.billingItem.id)} className="text-red-400">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between p-2 bg-blue-500/10 border border-blue-500/30">
                  <span className="text-sm font-bold text-white">TOTAL</span>
                  <span className="text-lg text-emerald-400">${totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          {/* DATE */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
              <CalendarIcon className="w-3 h-3" /> Re-Schedule
            </label>
            <input
              type="date"
              name="appointment_date"
              value={form.appointment_date}
              onChange={handleChange}
              className="w-full bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono text-white [color-scheme:dark]"
              style={{ colorScheme: 'dark' }}
            />
            {errors.appointment_date && <span className="text-[9px] text-red-400">{errors.appointment_date}</span>}
          </div>
          {/* NOTES */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
              <DocumentTextIcon className="w-3 h-3" /> Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              className="w-full bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono text-white"
            />
          </div>
          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2 text-[10px] font-black uppercase text-white/40 hover:text-white">
              Discard
            </button>
            <button type="submit" disabled={isSubmitting || !hasChanges} className="px-8 py-2 bg-blue-600 text-white text-[10px] font-black uppercase hover:bg-blue-500 disabled:opacity-50">
              {isSubmitting ? "PROCESSING..." : "Update_Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}