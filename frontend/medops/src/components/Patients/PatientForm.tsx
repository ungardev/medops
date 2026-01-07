// src/components/Patients/PatientForm.tsx
import React, { useState, useEffect } from "react";
import { Patient, PatientInput } from "../../types/patients";
import { useCreatePatient } from "../../hooks/patients/useCreatePatient";
import { useUpdatePatient } from "../../hooks/patients/useUpdatePatient";
import { 
  User, 
  IdCard, 
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[#11141a] p-1">
      {/* Sección: Identificación Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">
            Documento de Identidad (Cédula)
          </label>
          <div className="relative">
            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--palantir-muted)]" size={16} />
            <input
              className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:border-[var(--palantir-active)] focus:ring-1 focus:ring-[var(--palantir-active)]/20 transition-all outline-none"
              type="text"
              placeholder="Ej: 12345678"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
            />
          </div>
        </div>

        {/* Nombres */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">Primer Nombre *</label>
          <input
            className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">Segundo Nombre</label>
          <input
            className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none"
            type="text"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
          />
        </div>

        {/* Apellidos */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">Primer Apellido *</label>
          <input
            className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1">Segundo Apellido</label>
          <input
            className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none"
            type="text"
            value={secondLastName}
            onChange={(e) => setSecondLastName(e.target.value)}
          />
        </div>

        {/* Datos Demográficos */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <Calendar size={12} /> Fecha de Nacimiento
          </label>
          <input
            className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none color-scheme-dark"
            type="date"
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <Users size={12} /> Género
          </label>
          <select
            className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-2.5 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none"
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
          >
            <option value="Unknown">Seleccionar...</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
      </div>

      {/* Información de Contacto */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest ml-1 flex items-center gap-1.5">
          <Phone size={12} /> Datos de Contacto y Residencia
        </label>
        <textarea
          className="w-full bg-[#0d1117] border border-[var(--palantir-border)] rounded-lg py-3 px-4 text-sm text-white focus:border-[var(--palantir-active)] outline-none min-h-[80px] resize-none"
          placeholder="Dirección, teléfonos, correos..."
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
        />
      </div>

      {/* Alerta de Error */}
      {isError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
          <AlertCircle size={16} />
          <span>{errorMsg || "Error en el procesamiento de datos"}</span>
        </div>
      )}

      {/* Acciones del Formulario */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--palantir-border)]/50">
        <button
          className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-[var(--palantir-muted)] hover:text-white transition-all"
          type="button"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          className="flex items-center gap-2 bg-[var(--palantir-active)] hover:bg-[var(--palantir-active)]/90 text-white px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50"
          type="submit"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          {patient ? (isPending ? "Actualizando..." : "Guardar Cambios") : (isPending ? "Sincronizando..." : "Registrar Paciente")}
        </button>
      </div>
    </form>
  );
}
