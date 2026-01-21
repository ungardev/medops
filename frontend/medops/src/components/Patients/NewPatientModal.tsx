// src/components/Patients/NewPatientModal.tsx
import React from "react";
import ReactDOM from "react-dom";
import { useForm } from "react-hook-form";
import { useCreatePatient } from "../../hooks/patients/useCreatePatient";
import { PatientInput } from "../../types/patients";
import { XMarkIcon, UserPlusIcon } from "@heroicons/react/24/outline";
interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}
interface FormValues {
  first_name: string;
  middle_name?: string;
  last_name: string;
  second_last_name?: string;
  national_id: string;
  phone_number?: string;
  email?: string;
}
const NewPatientModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>();
  const createPatient = useCreatePatient();
  if (!open) return null;
  const onSubmit = (values: FormValues) => {
    const payload: PatientInput = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      national_id: values.national_id.trim(),
      ...(values.middle_name?.trim() && { middle_name: values.middle_name.trim() }),
      ...(values.second_last_name?.trim() && { second_last_name: values.second_last_name.trim() }),
      ...(values.phone_number?.trim() && { phone_number: values.phone_number.trim() }),
      ...(values.email?.trim() && { email: values.email.trim() }),
    };
    createPatient.mutate(payload, {
      onSuccess: () => {
        onCreated();
        reset();
        onClose();
      },
    });
  };
  const inputClass = "w-full bg-[var(--palantir-bg)] border border-[var(--palantir-border)] text-[var(--palantir-text)] text-[11px] font-mono p-2.5 rounded-sm focus:outline-none focus:border-[var(--palantir-active)] transition-all placeholder:text-[var(--palantir-muted)]/30 uppercase";
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div 
        className="bg-[var(--palantir-surface)] border border-[var(--palantir-border)] w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--palantir-border)] bg-[var(--palantir-bg)]/50">
          <div className="flex items-center gap-3">
            <UserPlusIcon className="w-5 h-5 text-[var(--palantir-active)]" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--palantir-text)]">
              Initialize_Subject_Record
            </h2>
          </div>
          <button onClick={onClose} className="text-[var(--palantir-muted)] hover:text-white transition-colors">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">Primary_Name*</label>
              <input {...register("first_name", { required: true })} className={inputClass} placeholder="NAME_ALPHA" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">Middle_Name</label>
              <input {...register("middle_name")} className={inputClass} placeholder="NAME_BRAVO" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">Surname_A*</label>
              <input {...register("last_name", { required: true })} className={inputClass} placeholder="SURNAME_ALPHA" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">Surname_B</label>
              <input {...register("second_last_name")} className={inputClass} placeholder="SURNAME_BRAVO" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">National_Identification_UID*</label>
            <input {...register("national_id", { required: true })} className={inputClass} placeholder="XX.XXX.XXX" />
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-[var(--palantir-border)] pt-4 mt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">Phone_Number</label>
              <input {...register("phone_number")} className={inputClass} placeholder="+00 000-0000" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest">Comms_Email</label>
              <input {...register("email")} className={inputClass} placeholder="SUBJECT@NETWORK.OPS" />
            </div>
          </div>
          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              disabled={createPatient.isPending}
              className="flex-1 bg-[var(--palantir-active)] text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/10"
            >
              {createPatient.isPending ? "Syncing_Data..." : "Commit_Record_to_Mainframe"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 border border-[var(--palantir-border)] text-[var(--palantir-muted)] text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
            >
              Abort
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById("modal-root")!
  );
};
export default NewPatientModal;