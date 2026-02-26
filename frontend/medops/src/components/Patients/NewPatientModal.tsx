// src/components/Patients/NewPatientModal.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { useCreatePatient } from "../../hooks/patients/useCreatePatient";
import { PatientInput } from "../../types/patients";
import { X, Save, Loader2 } from "lucide-react";
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
  const inputClass = "w-full bg-black/40 border border-white/20 rounded-sm px-4 py-3 text-[13px] text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-all";
  const labelStyles = "text-[11px] font-bold text-white/70 uppercase tracking-[0.1em] mb-2 block";
  const sectionStyles = "bg-white/[0.02] border border-white/10 rounded-sm p-5 space-y-4";
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#0a0a0b] border border-white/10 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-400/30">
              <Save className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-white">
                NEW_SUBJECT
              </h3>
              <p className="text-[10px] font-mono text-white/50 uppercase">Patient Registry</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className={sectionStyles}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyles}>Primary Name *</label>
                <input 
                  {...register("first_name", { required: true })} 
                  className={inputClass} 
                  placeholder="Name_Alpha" 
                />
              </div>
              <div>
                <label className={labelStyles}>Middle Name</label>
                <input {...register("middle_name")} className={inputClass} placeholder="Name_Bravo" />
              </div>
              <div>
                <label className={labelStyles}>Surname A *</label>
                <input 
                  {...register("last_name", { required: true })} 
                  className={inputClass} 
                  placeholder="Surname_Alpha" 
                />
              </div>
              <div>
                <label className={labelStyles}>Surname B</label>
                <input {...register("second_last_name")} className={inputClass} placeholder="Surname_Bravo" />
              </div>
            </div>
          </div>
          <div className={sectionStyles}>
            <div>
              <label className={labelStyles}>National ID *</label>
              <input {...register("national_id", { required: true })} className={inputClass} placeholder="XX.XXX.XXX" />
            </div>
          </div>
          <div className={sectionStyles}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyles}>Phone Number</label>
                <input {...register("phone_number")} className={inputClass} placeholder="+00 000-0000" />
              </div>
              <div>
                <label className={labelStyles}>Email</label>
                <input {...register("email")} className={inputClass} placeholder="SUBJECT@NETWORK.OPS" />
              </div>
            </div>
          </div>
          <div className={sectionStyles}>
            <div>
              <label className={labelStyles}>Biological Sex</label>
              <select {...register("gender")} className={inputClass}>
                <option value="">SELECT_OPTION</option>
                <option value="M">MASCULINO</option>
                <option value="F">FEMENINO</option>
                <option value="Other">OTHER</option>
                <option value="Unknown">UNKNOWN</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createPatient.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-sm text-[11px] font-bold uppercase tracking-widest text-white bg-emerald-500/20 border border-white/20 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {createPatient.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Commit Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default NewPatientModal;