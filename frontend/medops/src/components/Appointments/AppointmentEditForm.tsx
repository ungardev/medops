// src/components/Appointments/AppointmentEditForm.tsx
import React, { useState, useEffect } from "react";
import { Appointment, AppointmentInput } from "../../types/appointments";
import { 
  XMarkIcon, 
  PencilSquareIcon, 
  CalendarIcon,
  TagIcon,
  CurrencyDollarIcon,
  UserIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
interface Props {
  appointment: Appointment;
  onClose: () => void;
  onSubmit?: (id: number, data: AppointmentInput) => Promise<void> | void;
}
interface FormErrors {
  appointment_date?: string;
  expected_amount?: string;
  notes?: string;
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
  // Warning cambios no guardados
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
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "patient") return; // Paciente bloqueado
    
    setForm((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    // Limpiar error del campo
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!form.appointment_date) {
      newErrors.appointment_date = "REQUIRED_FIELD: Select execution date";
    }
    
    if (form.expected_amount && isNaN(Number(form.expected_amount.replace(/,/g, '')))) {
      newErrors.expected_amount = "INVALID_FORMAT: Numeric value required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ appointment_date: true, expected_amount: true, notes: true });
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const payload: AppointmentInput = {
        ...form,
        expected_amount: form.expected_amount ? String(form.expected_amount) : "",
      };
      
      if (onSubmit && appointment?.id) {
        await onSubmit(appointment.id, payload);
      }
      
      setHasChanges(false);
      onClose();
    } catch (err: any) {
      console.error("Update error:", err);
      setSubmitError(err?.message || "UPDATE_FAILED: Unable to modify appointment record");
    } finally {
      setIsSubmitting(false);
    }
  };
  const getFieldStatus = (fieldName: keyof FormErrors) => {
    if (!touched[fieldName]) return "neutral";
    return errors[fieldName] ? "error" : "valid";
  };
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4">
      <div className="max-w-lg w-full bg-[#0a0a0b] border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black/40 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <PencilSquareIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">
                Record_Modification_Mode
              </span>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                Edit_Entry <span className="text-white/40 font-mono ml-2">#ID-{appointment?.id}</span>
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="p-2 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        {/* Error Global */}
        {submitError && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 flex items-center gap-2">
            <ExclamationCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-[10px] text-red-400 font-mono uppercase">{submitError}</span>
          </div>
        )}
        {/* Audit Notice */}
        <div className="mx-6 mt-4 p-3 bg-blue-500/5 border-l-2 border-blue-500/50">
          <p className="text-[9px] font-mono text-blue-400/80 leading-tight">
            SYSTEM_NOTICE: Modifications to historical records are logged for auditing purposes. 
            Subject identity and medical center are locked.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Locked Patient Info */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <UserIcon className="w-3 h-3" />
              Locked_Subject_Identity
            </label>
            <div className="p-3 bg-white/5 border border-white/10 flex items-center gap-3 opacity-80">
              <div className="p-2 bg-blue-500/10 rounded-full">
                <UserCircleIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase">
                  {appointment?.patient?.full_name ?? "UNKNOWN_SUBJECT"}
                </p>
                <span className="text-[9px] font-mono text-white/40">
                  ID: {appointment?.patient?.id?.toString().padStart(6, '0') || '000000'} | 
                  DOC: {appointment?.patient?.national_id || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          {/* Institution (Locked) */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <BuildingOfficeIcon className="w-3 h-3" />
              Medical_Center_Location
            </label>
            <div className="p-3 bg-white/5 border border-white/10 flex items-center gap-3 opacity-60">
              <div className="p-2 bg-purple-500/10 rounded-full">
                <BuildingOfficeIcon className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {appointment?.institution?.name ?? "UNKNOWN_INSTITUTION"}
                </p>
                <span className="text-[9px] font-mono text-white/40">
                  TAX_ID: {appointment?.institution?.tax_id || 'N/A'}
                </span>
              </div>
            </div>
          </div>
          {/* Doctor Info */}
          <div className="p-3 bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <UserCircleIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-[8px] text-white/40 uppercase tracking-widest block">Attending_Physician</span>
              <p className="text-sm font-bold text-white">{appointment?.doctor?.full_name || "NOT_CONFIGURED"}</p>
              {appointment?.doctor?.colegiado_id && (
                <span className="text-[9px] font-mono text-blue-400">
                  LIC: {appointment.doctor.colegiado_id}
                </span>
              )}
            </div>
          </div>
          {/* Date and Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                <CalendarIcon className="w-3 h-3" />
                Re-Schedule_Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="appointment_date"
                  value={form.appointment_date}
                  onChange={handleChange}
                  className={`w-full bg-black/40 border px-3 py-2 text-sm font-mono text-white focus:outline-none transition-all [color-scheme:dark] ${
                    getFieldStatus("appointment_date") === "error"
                      ? "border-red-500/50 focus:border-red-500"
                      : getFieldStatus("appointment_date") === "valid"
                      ? "border-emerald-500/50"
                      : "border-white/10 focus:border-blue-500/50"
                  }`}
                  style={{ colorScheme: 'dark' }}
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  {getFieldStatus("appointment_date") === "valid" && (
                    <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                  )}
                  {getFieldStatus("appointment_date") === "error" && (
                    <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              {errors.appointment_date && (
                <span className="text-[9px] text-red-400 font-mono flex items-center gap-1">
                  <ExclamationCircleIcon className="w-3 h-3" />
                  {errors.appointment_date}
                </span>
              )}
            </div>
            
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                <TagIcon className="w-3 h-3" />
                Op_Classification
              </label>
              <select
                name="appointment_type"
                value={form.appointment_type}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono text-white focus:border-blue-500/50 outline-none transition-all appearance-none"
              >
                <option value="general" className="bg-gray-900">GENERAL_DEPLOYMENT</option>
                <option value="specialized" className="bg-gray-900">SPECIALIZED_OP</option>
              </select>
            </div>
          </div>
          {/* Amount */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <CurrencyDollarIcon className="w-3 h-3" />
              Resource_Reallocation (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-mono text-sm">$</span>
              <input
                type="text"
                name="expected_amount"
                value={form.expected_amount}
                onChange={handleChange}
                className={`w-full bg-black/40 border pl-8 pr-3 py-2 text-sm font-mono text-white text-right focus:outline-none transition-all ${
                  getFieldStatus("expected_amount") === "error"
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-white/10 focus:border-blue-500/50"
                }`}
              />
            </div>
            {errors.expected_amount && (
              <span className="text-[9px] text-red-400 font-mono">{errors.expected_amount}</span>
            )}
          </div>
          {/* Notes - EDITABLE */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <DocumentTextIcon className="w-3 h-3" />
              Operational_Intelligence_Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="ENTER_OBSERVATIONS_OR_UPDATE_EXISTING_NOTES..."
              className="w-full bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono text-white focus:border-blue-500/50 outline-none transition-all resize-none placeholder:text-white/10"
            />
          </div>
          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors disabled:opacity-50"
            >
              Discard_Changes
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !hasChanges}
              className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className="w-3 h-3 animate-spin" />
                  PROCESSING...
                </>
              ) : (
                "Update_System_Record"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}