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
  const inputClass = "w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30";
  const labelStyles = "text-[10px] font-medium text-white/60 uppercase tracking-wider mb-1.5 block";
  const sectionStyles = "bg-white/5 border border-white/10 rounded-lg p-5 space-y-4";
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#1a1a1b] border border-white/15 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-white/5 sticky top-0 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/15 border border-emerald-500/25 rounded-lg">
              <Save className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[12px] font-semibold text-white">
                Registrar Nuevo Paciente
              </h3>
              <p className="text-[10px] text-white/50 mt-0.5">Complete los datos del paciente</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className={sectionStyles}>
            <h4 className="text-[11px] font-medium text-white/70 uppercase tracking-wider mb-3">Nombre Completo</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyles}>Nombre *</label>
                <input 
                  {...register("first_name", { required: true })} 
                  className={inputClass} 
                  placeholder="Primer nombre" 
                />
              </div>
              <div>
                <label className={labelStyles}>Segundo Nombre</label>
                <input {...register("middle_name")} className={inputClass} placeholder="Segundo nombre" />
              </div>
              <div>
                <label className={labelStyles}>Apellido *</label>
                <input 
                  {...register("last_name", { required: true })} 
                  className={inputClass} 
                  placeholder="Primer apellido" 
                />
              </div>
              <div>
                <label className={labelStyles}>Segundo Apellido</label>
                <input {...register("second_last_name")} className={inputClass} placeholder="Segundo apellido" />
              </div>
            </div>
          </div>
          <div className={sectionStyles}>
            <h4 className="text-[11px] font-medium text-white/70 uppercase tracking-wider mb-3">Identificación</h4>
            <div>
              <label className={labelStyles}>Cédula de Identidad *</label>
              <input {...register("national_id", { required: true })} className={inputClass} placeholder="Ej: V-12345678" />
            </div>
          </div>
          <div className={sectionStyles}>
            <h4 className="text-[11px] font-medium text-white/70 uppercase tracking-wider mb-3">Contacto</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyles}>Teléfono</label>
                <input {...register("phone_number")} className={inputClass} placeholder="+58 412-1234567" />
              </div>
              <div>
                <label className={labelStyles}>Correo Electrónico</label>
                <input {...register("email")} className={inputClass} placeholder="correo@ejemplo.com" />
              </div>
            </div>
          </div>
          <div className={sectionStyles}>
            <h4 className="text-[11px] font-medium text-white/70 uppercase tracking-wider mb-3">Información Adicional</h4>
            <div>
              <label className={labelStyles}>Género</label>
              <select {...register("gender")} className={inputClass}>
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Other">Otro</option>
                <option value="Unknown">Desconocido</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-[11px] font-medium text-white/60 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createPatient.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[11px] font-medium text-white bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all disabled:opacity-50"
            >
              {createPatient.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Guardar Paciente
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