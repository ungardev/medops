// src/components/Appointments/AppointmentForm.tsx
import React, { useState, useEffect, useMemo } from "react";
import { AppointmentInput } from "types/appointments";
import type { Patient } from "types/patients";
import { usePatients } from "hooks/patients/usePatients";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import NewPatientModal from "components/Patients/NewPatientModal";
import { 
  UserPlusIcon, 
  XMarkIcon, 
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  TagIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
interface Props {
  date?: Date;
  onClose: () => void;
  onSubmit: (data: AppointmentInput) => Promise<void> | void;
}
interface FormErrors {
  patient?: string;
  institution?: string;
  doctor?: string;
  appointment_date?: string;
  expected_amount?: string;
}
export default function AppointmentForm({ date, onClose, onSubmit }: Props) {
  const { institutions, activeInstitution } = useInstitutions();
  const { data: doctorConfig } = useDoctorConfig();
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const { data, isLoading, isError, refetch } = usePatients(1, 100); // Aumentado a 100
  const patientList: Patient[] = data?.results ?? [];
  
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
  // Detectar cambios no guardados
  const [hasChanges, setHasChanges] = useState(false);
  
  useEffect(() => {
    if (activeInstitution?.id) {
      setForm((prev) => ({
        ...prev,
        institution: activeInstitution.id!,
      }));
    }
  }, [activeInstitution?.id]);
  // Warning de cambios no guardados
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
    setForm((prev) => ({
      ...prev,
      [name]: name === "patient" ? Number(value) || 0 : value,
    }));
    setHasChanges(true);
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    // Limpiar error del campo
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!form.patient || form.patient === 0) {
      newErrors.patient = "REQUIRED_FIELD: Select patient identity";
    }
    
    if (!form.institution || form.institution === 0) {
      newErrors.institution = "REQUIRED_FIELD: Select medical center";
    }
    
    if (!form.doctor || form.doctor === 0) {
      newErrors.doctor = "CONFIG_ERROR: No attending physician configured";
    }
    
    if (!form.appointment_date) {
      newErrors.appointment_date = "REQUIRED_FIELD: Select execution date";
    }
    
    // Validar formato de monto (opcional pero si se llena debe ser número válido)
    if (form.expected_amount && isNaN(Number(form.expected_amount.replace(/,/g, '')))) {
      newErrors.expected_amount = "INVALID_FORMAT: Numeric value required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ patient: true, institution: true, doctor: true, appointment_date: true, expected_amount: true });
    
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
      await onSubmit(payload);
      setHasChanges(false);
      onClose();
    } catch (err: any) {
      console.error("Submit error:", err);
      setSubmitError(err?.message || "SUBMIT_FAILED: Unable to create appointment record");
    } finally {
      setIsSubmitting(false);
    }
  };
  const getFieldStatus = (fieldName: keyof FormErrors) => {
    if (!touched[fieldName]) return "neutral";
    return errors[fieldName] ? "error" : "valid";
  };
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full bg-[#0a0a0b] border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 bg-black/40 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 border border-blue-500/30 bg-blue-500/10 text-blue-400">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em]">
                Operation_Initialization
              </span>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                New_Appointment_Entry
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
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Patient Selection with Search */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <UserIcon className="w-3 h-3" />
              Target_Subject_Identity
            </label>
            
            {/* Search Input */}
            <div className="relative mb-2">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="SEARCH_PATIENT..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 pl-9 pr-3 py-2 text-sm font-mono text-white placeholder:text-white/20 focus:border-blue-500/50 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-[10px] font-mono text-blue-400 animate-pulse py-2 px-3 bg-black/40 border border-white/10">
                    <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    FETCHING_DATABASE_RECORDS...
                  </div>
                ) : isError ? (
                  <div className="text-[10px] font-mono text-red-400 py-2">
                    ERROR_LOADING_PATIENTS
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      name="patient"
                      value={form.patient || ""}
                      onChange={handleChange}
                      className={`w-full bg-black/40 border px-3 py-2 text-sm font-mono text-white focus:outline-none transition-all appearance-none ${
                        getFieldStatus("patient") === "error" 
                          ? "border-red-500/50 focus:border-red-500" 
                          : getFieldStatus("patient") === "valid"
                          ? "border-emerald-500/50"
                          : "border-white/10 focus:border-blue-500/50"
                      }`}
                    >
                      <option value="" className="bg-gray-900 text-white/50">SELECT_IDENTITY</option>
                      {filteredPatients.length === 0 ? (
                        <option value="" disabled className="bg-gray-900 text-white/30">
                          NO_PATIENTS_FOUND
                        </option>
                      ) : (
                        filteredPatients.map((p) => (
                          <option key={p.id} value={p.id} className="bg-gray-900">
                            {p.full_name?.toUpperCase()} [ID: {p.id?.toString().padStart(4, '0')}]
                          </option>
                        ))
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/30">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                    
                    {/* Status Icon */}
                    <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
                      {getFieldStatus("patient") === "valid" && (
                        <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                      )}
                      {getFieldStatus("patient") === "error" && (
                        <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => setShowNewPatientModal(true)}
                className="p-2 border border-white/10 bg-white/5 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
                title="REGISTER_NEW_SUBJECT"
                disabled={isSubmitting}
              >
                <UserPlusIcon className="h-5 w-5" />
              </button>
            </div>
            
            {errors.patient && (
              <span className="text-[9px] text-red-400 font-mono flex items-center gap-1">
                <ExclamationCircleIcon className="w-3 h-3" />
                {errors.patient}
              </span>
            )}
            
            {filteredPatients.length > 0 && patientSearch && (
              <span className="text-[8px] text-white/30 font-mono">
                FOUND_{filteredPatients.length}_RECORDS
              </span>
            )}
          </div>
          {/* Institution */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <BuildingOfficeIcon className="w-3 h-3" />
              Medical_Center_Location
            </label>
            <div className="relative">
              <select
                name="institution"
                value={form.institution || ""}
                onChange={handleChange}
                className={`w-full bg-black/40 border px-3 py-2 text-sm font-mono text-white focus:outline-none transition-all appearance-none ${
                  getFieldStatus("institution") === "error"
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-white/10 focus:border-blue-500/50"
                }`}
              >
                <option value="" className="bg-gray-900 text-white/50">SELECT_INSTITUTION</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id} className="bg-gray-900">
                    {inst.name?.toUpperCase()} [ID: {inst.id}] {activeInstitution?.id === inst.id ? "● ACTIVE" : ""}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/30">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            {errors.institution && (
              <span className="text-[9px] text-red-400 font-mono">{errors.institution}</span>
            )}
          </div>
          {/* Doctor Info Badge */}
          <div className="p-3 bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <UserCircleIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-[8px] text-white/40 uppercase tracking-widest block">Attending_Physician</span>
              <p className="text-sm font-bold text-white">{doctorConfig?.full_name || "NOT_CONFIGURED"}</p>
              {doctorConfig?.specialty && (
                <span className="text-[9px] font-mono text-blue-400">{doctorConfig.specialty}</span>
              )}
            </div>
          </div>
          
          {errors.doctor && (
            <span className="text-[9px] text-red-400 font-mono">{errors.doctor}</span>
          )}
          {/* Date and Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                <CalendarIcon className="w-3 h-3" />
                Execution_Timestamp
              </label>
              <input
                type="date"
                name="appointment_date"
                value={form.appointment_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full bg-black/40 border px-3 py-2 text-sm font-mono text-white focus:outline-none transition-all [color-scheme:dark] ${
                  getFieldStatus("appointment_date") === "error"
                    ? "border-red-500/50 focus:border-red-500"
                    : getFieldStatus("appointment_date") === "valid"
                    ? "border-emerald-500/50"
                    : "border-white/10 focus:border-blue-500/50"
                }`}
                style={{ colorScheme: 'dark' }}
              />
              {errors.appointment_date && (
                <span className="text-[9px] text-red-400 font-mono">{errors.appointment_date}</span>
              )}
            </div>
            
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                <TagIcon className="w-3 h-3" />
                Module_Classification
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
              Resource_Allocation (USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-mono text-sm">$</span>
              <input
                type="text"
                name="expected_amount"
                placeholder="0.00"
                value={form.expected_amount}
                onChange={handleChange}
                className={`w-full bg-black/40 border pl-8 pr-3 py-2 text-sm font-mono text-white text-right focus:outline-none transition-all placeholder:text-white/10 ${
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
          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Operational_Intelligence_Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="ENTER_OBSERVATIONS..."
              className="w-full bg-black/40 border border-white/10 px-3 py-2 text-sm font-mono text-white focus:border-blue-500/50 outline-none transition-all resize-none placeholder:text-white/10"
            />
          </div>
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors disabled:opacity-50"
            >
              Abort_Mission
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  PROCESSING...
                </>
              ) : (
                "Commit_Record"
              )}
            </button>
          </div>
        </form>
        
        {showNewPatientModal && (
          <NewPatientModal
            open={showNewPatientModal}
            onClose={() => {
              setShowNewPatientModal(false);
              refetch();
            }}
            onCreated={() => {
              setShowNewPatientModal(false);
              refetch();
            }}
          />
        )}
      </div>
    </div>
  );
}