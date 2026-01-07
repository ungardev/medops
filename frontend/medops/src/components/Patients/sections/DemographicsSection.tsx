// src/components/Patients/sections/DemographicsSection.tsx
import React, { useState, useEffect } from "react";
import { Patient, PatientInput } from "../../../types/patients";
import { useUpdatePatient } from "../../../hooks/patients/useUpdatePatient";
import { 
  PencilSquareIcon, 
  CheckIcon, 
  XMarkIcon,
  MapPinIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";

interface DemographicsSectionProps {
  patient: Patient;
  onRefresh: () => void;
}

interface FieldProps {
  label: string;
  value: string;
  type?: "text" | "date" | "email" | "number";
  multiline?: boolean;
  span?: 3 | 4 | 6 | 8 | 9 | 12;
  editing: boolean;
  onChange?: (value: string) => void;
}

function Field({ label, value, type = "text", multiline = false, span = 3, editing, onChange }: FieldProps) {
  const colClasses: Record<number, string> = {
    3: "md:col-span-3", 4: "md:col-span-4", 6: "md:col-span-6",
    8: "md:col-span-8", 9: "md:col-span-9", 12: "md:col-span-12"
  };
  const colClass = `col-span-12 ${colClasses[span] || "md:col-span-3"}`;

  return (
    <div className={`${colClass} group`}>
      <label className="block text-[9px] font-mono font-bold text-[var(--palantir-muted)] uppercase tracking-widest mb-1 group-focus-within:text-[var(--palantir-active)] transition-colors">
        {label}
      </label>
      {editing ? (
        multiline ? (
          <textarea
            rows={2}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-sm px-3 py-2 text-xs font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] focus:outline-none focus:ring-1 focus:ring-[var(--palantir-active)]/30 transition-all uppercase"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-sm px-3 py-2 text-xs font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] focus:outline-none focus:ring-1 focus:ring-[var(--palantir-active)]/30 transition-all uppercase"
          />
        )
      ) : (
        <div className="min-h-[32px] flex items-center border-b border-transparent group-hover:border-[var(--palantir-border)] transition-all">
          <p className="text-[11px] font-bold text-[var(--palantir-text)] uppercase tracking-tight">
            {value && value !== "" ? value : <span className="text-[var(--palantir-muted)] opacity-30">NO_DATA_ENTRY</span>}
          </p>
        </div>
      )}
    </div>
  );
}

export default function DemographicsSection({ patient, onRefresh }: DemographicsSectionProps) {
  const [editing, setEditing] = useState(false);
  
  // ✅ Definimos el tipo de chain para que TS sepa qué propiedades buscar
  const chain = (patient.address_chain as any) || {};
  
  const [form, setForm] = useState<Partial<PatientInput>>({});
  const updatePatient = useUpdatePatient(patient.id);

  useEffect(() => {
    // ✅ Usamos ?? "" para convertir null/undefined en strings vacíos y limpiar errores de tipos
    setForm({
      national_id: patient.national_id ?? "",
      first_name: patient.first_name ?? "",
      middle_name: patient.middle_name ?? "",
      last_name: patient.last_name ?? "",
      second_last_name: patient.second_last_name ?? "",
      birthdate: patient.birthdate ?? "",
      birth_place: patient.birth_place ?? "",
      birth_country: patient.birth_country ?? "",
      email: patient.email ?? "",
      contact_info: patient.contact_info ?? "",
      address: patient.address ?? "",
      country_id: chain.country_id,
      state_id: chain.state_id,
      municipality_id: chain.municipality_id,
      parish_id: chain.parish_id,
      neighborhood_id: chain.neighborhood_id,
    });
  }, [patient, chain]);

  const handleSave = () => {
    updatePatient.mutate(form as PatientInput, {
      onSuccess: () => { 
        setEditing(false); 
        onRefresh(); 
      }
    });
  };

  const direccionCompleta = `${form.address || ""}, ${chain.neighborhood || ""}, ${chain.parish || ""}`.trim().toUpperCase();

  return (
    <div className="bg-[var(--palantir-surface)]/20 border border-[var(--palantir-border)] rounded-sm overflow-hidden transition-all duration-500 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)]">
      <div className="bg-[var(--palantir-border)]/20 px-4 py-2 flex justify-between items-center border-b border-[var(--palantir-border)]">
        <div className="flex items-center gap-2">
          <UserCircleIcon className="w-4 h-4 text-[var(--palantir-active)]" />
          <span className="text-[10px] font-mono font-black text-[var(--palantir-text)] uppercase tracking-widest">Subject_Demographics</span>
        </div>
        
        {editing ? (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1 text-[9px] font-mono text-[var(--palantir-muted)] hover:text-white transition-colors">
              <XMarkIcon className="w-3 h-3" /> CANCEL
            </button>
            <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1 bg-[var(--palantir-active)] text-white text-[9px] font-bold rounded-sm shadow-lg shadow-blue-500/20">
              <CheckIcon className="w-3 h-3" /> COMMIT_CHANGES
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-3 py-1 border border-[var(--palantir-border)] text-[9px] font-mono text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] hover:border-[var(--palantir-active)] transition-all">
            <PencilSquareIcon className="w-3 h-3" /> EDIT_RECORD
          </button>
        )}
      </div>

      <div className="p-6 grid grid-cols-12 gap-x-8 gap-y-6">
        {/* Usamos el operador || "" para asegurar que siempre pasamos un string al componente Field */}
        <Field span={3} label="Identity_ID" value={String(form.national_id || "")} editing={editing} onChange={(v) => setForm({...form, national_id: v})} />
        <Field span={3} label="First_Name" value={form.first_name || ""} editing={editing} onChange={(v) => setForm({...form, first_name: v})} />
        <Field span={3} label="Last_Name" value={form.last_name || ""} editing={editing} onChange={(v) => setForm({...form, last_name: v})} />
        <Field span={3} label="Birth_Date" type="date" value={form.birthdate || ""} editing={editing} onChange={(v) => setForm({...form, birthdate: v})} />
        
        <Field span={3} label="Email_Address" value={form.email || ""} editing={editing} onChange={(v) => setForm({...form, email: v})} />
        <Field span={3} label="Contact_Line" value={form.contact_info || ""} editing={editing} onChange={(v) => setForm({...form, contact_info: v})} />
        <Field span={6} label="Birth_Location" value={`${form.birth_place || ""}, ${form.birth_country || ""}`} editing={editing} onChange={(v) => setForm({...form, birth_place: v})} />

        <div className="col-span-12 h-[1px] bg-gradient-to-r from-[var(--palantir-border)] via-transparent to-transparent my-2" />

        <div className="col-span-12 flex items-center gap-2 mb-2">
          <MapPinIcon className="w-3 h-3 text-[var(--palantir-muted)]" />
          <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-[0.2em]">Geographic_Location_Data</span>
        </div>

        {!editing ? (
          <div className="col-span-12 bg-[var(--palantir-bg)]/50 border border-[var(--palantir-border)] p-3 rounded-sm">
            <label className="block text-[8px] font-mono text-[var(--palantir-muted)] uppercase mb-1">Primary_Residence_Chain</label>
            <p className="text-[10px] font-mono text-[var(--palantir-text)] leading-relaxed">{direccionCompleta || "NO_LOCATION_DATA_AVAILABLE"}</p>
          </div>
        ) : (
          <Field span={12} label="Full_Address_Details" value={form.address || ""} editing={editing} multiline onChange={(v) => setForm({...form, address: v})} />
        )}
      </div>
    </div>
  );
}
