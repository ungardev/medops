// src/components/Patients/PatientForm.tsx
import React, { useState, useEffect } from "react";
import { Patient, PatientInput } from "../../types/patients";
import { useCreatePatient } from "../../hooks/patients/useCreatePatient";
import { useUpdatePatient } from "../../hooks/patients/useUpdatePatient";
import { 
  IdCard, 
  User, 
  Calendar, 
  Users, 
  Phone, 
  Save, 
  X, 
  Loader2, 
  AlertCircle 
} from "lucide-react";

interface PatientFormProps {
  patient?: Patient | null;
  onClose?: () => void;
  onSaved?: () => void;
}

type Gender = "M" | "F" | "Unknown";

export default function PatientForm({ patient, onClose, onSaved }: PatientFormProps) {
  const [nationalId, setNationalId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [secondLastName, setSecondLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<Gender>("Unknown");
  const [contactInfo, setContactInfo] = useState("");

  const createPatient = useCreatePatient();
  const updatePatient = patient ? useUpdatePatient(patient.id) : null;
  
  const isPending = patient ? updatePatient?.isPending : createPatient.isPending;
  const isError = createPatient.isError || updatePatient?.isError;
  const errorMsg = (createPatient.error as any)?.message || (updatePatient?.error as any)?.message;

  useEffect(() => {
    if (patient) {
      setNationalId(patient.national_id || "");
      setFirstName(patient.first_name || "");
      setMiddleName(patient.middle_name || "");
      setLastName(patient.last_name || "");
      setSecondLastName(patient.second_last_name || "");
      setBirthdate(patient.birthdate || "");
      const g = patient.gender as Gender | undefined;
      setGender(g === "M" || g === "F" || g === "Unknown" ? g : "Unknown");
      setContactInfo(patient.contact_info || "");
    }
  }, [patient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: PatientInput = {
      national_id: nationalId || undefined,
      first_name: firstName,
      middle_name: middleName || undefined,
      last_name: lastName,
      second_last_name: secondLastName || undefined,
      birthdate: birthdate || undefined,
      gender,
      contact_info: contactInfo || undefined,
    };

    const mutation = patient && updatePatient ? updatePatient : createPatient;

    mutation.mutate(payload, {
      onSuccess: () => {
        onSaved?.();
        onClose?.();
      },
    });
  };

  const inputClass = "w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30";
  const labelClass = "text-xs font-medium text-white/60 uppercase tracking-wider mb-2 block";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[#11141a] p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2 md:col-span-2">
          <label className={labelClass}>
            <IdCard className="w-4 h-4 inline mr-1.5" />
            Documento de Identidad (Cédula)
          </label>
          <div className="relative">
            <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            <input
              className="w-full bg-white/5 border border-white/15 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-all"
              type="text"
              placeholder="Ej: 12345678"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Primer Nombre *</label>
          <input
            className={inputClass}
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Segundo Nombre</label>
          <input
            className={inputClass}
            type="text"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>Primer Apellido *</label>
          <input
            className={inputClass}
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>Segundo Apellido</label>
          <input
            className={inputClass}
            type="text"
            value={secondLastName}
            onChange={(e) => setSecondLastName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className={labelClass}>
            <Calendar className="w-4 h-4 inline mr-1.5" />
            Fecha de Nacimiento
          </label>
          <input
            className={`${inputClass} color-scheme-dark`}
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className={labelClass}>
            <Users className="w-4 h-4 inline mr-1.5" />
            Género
          </label>
          <select
            className={inputClass}
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
          >
            <option value="Unknown">Seleccionar...</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className={labelClass}>
          <Phone className="w-4 h-4 inline mr-1.5" />
          Datos de Contacto y Residencia
        </label>
        <textarea
          className="w-full bg-white/5 border border-white/15 rounded-xl py-3 px-4 text-sm text-white/80 focus:border-emerald-500/50 focus:outline-none transition-all min-h-[80px] resize-none"
          placeholder="Dirección, teléfonos, correos..."
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
        />
      </div>

      {isError && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
          <AlertCircle size={18} />
          <span>{errorMsg || "Error en el procesamiento de datos"}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/10">
        <button
          className="px-5 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-colors hover:bg-white/5"
          type="button"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="flex items-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 px-6 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          type="submit"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          {patient ? (isPending ? "Actualizando..." : "Guardar Cambios") : (isPending ? "Sincronizando..." : "Registrar Paciente")}
        </button>
      </div>
    </form>
  );
}