// src/components/Patients/NewPatientModal.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { useCreatePatient } from "../../hooks/patients/useCreatePatient";
import { PatientInput } from "../../types/patients";
import EliteModal from "../Common/EliteModal";
interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  onPatientCreated?: (patientId: number) => void;
}
interface FormValues {
  first_name: string;
  middle_name?: string;
  last_name: string;
  second_last_name?: string;
  national_id: string;
  phone_number?: string;
  email?: string;
  gender?: "M" | "F" | "Other" | "Unknown";
}
const NewPatientModal: React.FC<Props> = ({ open, onClose, onCreated, onPatientCreated }) => {
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
      ...(values.gender && { gender: values.gender }),
    };
    createPatient.mutate(payload, {
      onSuccess: (data) => {
        if (onPatientCreated) {
          onPatientCreated(data.id);
        }
        onCreated();
        reset();
        onClose();
      },
    });
  };
  // ✅ FIX: Eliminado "uppercase" para que el usuario vea el texto tal como lo escribe
  const inputClass = "w-full bg-black border border-white/10 rounded-sm px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/40 transition-all font-mono";
  return (
    <EliteModal 
      open={open} 
      onClose={onClose} 
      title="INITIALIZE_SUBJECT_RECORD"
      maxWidth="max-w-xl"
      showDotIndicator={true}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Primary_Name*</label>
            <input {...register("first_name", { required: true })} className={inputClass} placeholder="Name_Alpha" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Middle_Name</label>
            <input {...register("middle_name")} className={inputClass} placeholder="Name_Bravo" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Surname_A*</label>
            <input {...register("last_name", { required: true })} className={inputClass} placeholder="Surname_Alpha" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Surname_B</label>
            <input {...register("second_last_name")} className={inputClass} placeholder="Surname_Bravo" />
          </div>
        </div>
        
        <div className="space-y-1">
          <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">National_Identification_UID*</label>
          <input {...register("national_id", { required: true })} className={inputClass} placeholder="XX.XXX.XXX" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-2">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Phone_Number</label>
            <input {...register("phone_number")} className={inputClass} placeholder="+00 000-0000" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Comms_Email</label>
            <input {...register("email")} className={inputClass} placeholder="SUBJECT@NETWORK.OPS" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-2">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest">Biological_Sex</label>
            <select {...register("gender")} className={inputClass}>
              <option value="">SELECT_OPTION</option>
              <option value="M">MASCULINO</option>
              <option value="F">FEMENINO</option>
              <option value="Other">OTHER</option>
              <option value="Unknown">UNKNOWN</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-3 pt-6 border-t border-white/10">
          <button
            type="submit"
            disabled={createPatient.isPending}
            className="flex-1 bg-white text-black text-[10px] font-black uppercase tracking-widest py-3 rounded-sm hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {createPatient.isPending ? "Syncing_Data..." : "Commit_Record_to_Mainframe"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
          >
            Abort
          </button>
        </div>
      </form>
    </EliteModal>
  );
};
export default NewPatientModal;