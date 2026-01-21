// src/components/Appointments/AppointmentForm.tsx
import React, { useState, useEffect } from "react";
import { AppointmentInput } from "types/appointments";
import type { Patient } from "types/patients";
import { usePatients } from "hooks/patients/usePatients";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import NewPatientModal from "components/Patients/NewPatientModal";
import { UserPlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
interface Props {
  date?: Date;
  onClose: () => void;
  onSubmit: (data: AppointmentInput) => void;
}
export default function AppointmentForm({ date, onClose, onSubmit }: Props) {
  const { institutions, activeInstitution } = useInstitutions();
  const { data: doctorConfig } = useDoctorConfig();
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  
  const { data, isLoading, isError, refetch } = usePatients(1, 50);
  const patientList: Patient[] = data?.results ?? [];
  
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
  useEffect(() => {
    if (activeInstitution?.id) {
      setForm(prev => ({
        ...prev,
        institution: activeInstitution.id!,
      }));
    }
  }, [activeInstitution?.id]);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "patient" ? Number(value) || 0 : value,
    }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient || form.patient === 0) {
      alert("CRITICAL_ERROR: Select a Subject_Identity before commit.");
      return;
    }
    if (!form.institution || form.institution === 0) {
      alert("CRITICAL_ERROR: Select a Medical Center before commit.");
      return;
    }
    if (!form.doctor || form.doctor === 0) {
      alert("CRITICAL_ERROR: No attending physician configured.");
      return;
    }
    const payload: AppointmentInput = {
      ...form,
      expected_amount: form.expected_amount ? String(form.expected_amount) : "",
    };
    onSubmit(payload);
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-lg w-full bg-[var(--palantir-bg)] border border-[var(--palantir-border)] shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--palantir-border)] bg-black/40">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-[var(--palantir-active)] uppercase tracking-[0.3em]">
              Operation_Initialization
            </span>
            <h2 className="text-lg font-black text-[var(--palantir-text)] uppercase tracking-tight">
              New_Appointment_Entry
            </h2>
          </div>
          <button
            type="button"
            className="p-1 hover:bg-red-500/20 text-[var(--palantir-muted)] hover:text-red-500 transition-all"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">
              Target_Subject_Identity
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                {isLoading ? (
                  <div className="text-[10px] font-mono text-[var(--palantir-active)] animate-pulse py-2">
                    FETCHING_DATABASE_RECORDS...
                  </div>
                ) : (
                  <select
                    name="patient"
                    value={form.patient || ""}
                    onChange={handleChange}
                    required
                    className="w-full bg-black/40 border border-[var(--palantir-border)] px-3 py-2 text-sm font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all appearance-none"
                  >
                    <option value="" className="bg-gray-900">SELECT_IDENTITY</option>
                    {patientList.map((p) => (
                      <option key={p.id} value={p.id} className="bg-gray-900">
                        {p.full_name.toUpperCase()} [REF_ID: {p.id.toString().padStart(4, '0')}]
                      </option>
                    ))}
                  </select>
                )}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[var(--palantir-muted)]">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setShowNewPatientModal(true)}
                className="p-2 border border-[var(--palantir-border)] bg-black/20 text-[var(--palantir-active)] hover:bg-[var(--palantir-active)] hover:text-white transition-all shadow-[0_0_10px_rgba(30,136,229,0.1)]"
                title="REGISTER_NEW_SUBJECT"
              >
                <UserPlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">
              Medical_Center_Location
            </label>
            <select
              name="institution"
              value={form.institution || ""}
              onChange={handleChange}
              required
              className="w-full bg-black/40 border border-[var(--palantir-border)] px-3 py-2 text-sm font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all appearance-none"
            >
              <option value="" className="bg-gray-900">SELECT_INSTITUTION</option>
              {institutions.map((inst) => (
                <option 
                  key={inst.id} 
                  value={inst.id} 
                  className="bg-gray-900"
                >
                  {inst.name.toUpperCase()} [ID: {inst.id}] {activeInstitution?.id === inst.id ? "● ACTIVE" : ""}
                </option>
              ))}
            </select>
          </div>
          <input
            type="hidden"
            name="doctor"
            value={form.doctor || ""}
          />
          <div className="text-[9px] font-mono text-[var(--palantir-muted)]">
            ATTENDING_PHYSICIAN: {doctorConfig?.full_name || "NOT_CONFIGURED"}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">Execution_Timestamp</label>
              <input
                type="date"
                name="appointment_date"
                value={form.appointment_date}
                onChange={handleChange}
                required
                className="w-full bg-black/40 border border-[var(--palantir-border)] px-3 py-2 text-sm font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">Module_Classification</label>
              <select
                name="appointment_type"
                value={form.appointment_type}
                onChange={handleChange}
                className="w-full bg-black/40 border border-[var(--palantir-border)] px-3 py-2 text-sm font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all appearance-none"
              >
                <option value="general" className="bg-gray-900">GENERAL_DEPLOYMENT</option>
                <option value="specialized" className="bg-gray-900">SPECIALIZED_OP</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">Resource_Allocation (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-[var(--palantir-active)] font-mono text-sm">$</span>
              <input
                type="text"
                name="expected_amount"
                placeholder="0.00"
                value={form.expected_amount}
                onChange={handleChange}
                className="w-full bg-black/40 border border-[var(--palantir-border)] pl-8 pr-3 py-2 text-sm font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">Operational_Intelligence_Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="ENTER_OBSERVATIONS..."
              className="w-full bg-black/40 border border-[var(--palantir-border)] px-3 py-2 text-sm font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all resize-none placeholder:text-gray-700"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--palantir-border)]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-[var(--palantir-muted)] hover:text-white transition-colors"
            >
              Abort_Mission
            </button>
            <button
              type="submit"
              className="px-8 py-2 bg-[var(--palantir-active)] text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(30,136,229,0.3)] hover:shadow-[0_0_25px_rgba(30,136,229,0.5)] transition-all"
            >
              Commit_Record
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