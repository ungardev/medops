// src/components/Patients/sections/DemographicsSection.tsx
import React, { useState, useEffect, useMemo } from "react";
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
  type?: "text" | "date" | "email" | "number" | "select";
  options?: { value: string; label: string }[];
  multiline?: boolean;
  span?: 3 | 4 | 6 | 8 | 9 | 12;
  editing: boolean;
  onChange?: (value: string) => void;
}
function Field({ label, value, type = "text", options = [], multiline = false, span = 3, editing, onChange }: FieldProps) {
  const colClasses: Record<number, string> = {
    3: "md:col-span-3", 4: "md:col-span-4", 6: "md:col-span-6",
    8: "md:col-span-8", 9: "md:col-span-9", 12: "md:col-span-12"
  };
  const colClass = `col-span-12`;
  return (
    <div className="group">
      <label className="block text-[9px] font-mono font-bold text-[var(--palantir-muted)] uppercase tracking-widest mb-1 group-focus-within:text-[var(--palantir-active)] transition-colors">
        {label}
      </label>
      {editing ? (
        type === "select" ? (
          <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-sm px-4 py-3 text-sm font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] focus:outline-none focus:ring-1 focus:ring-[var(--palantir-active)]/30 transition-all uppercase"
          >
            <option value="">Seleccione...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : multiline ? (
          <textarea
            rows={3}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
              }
            }}
            className="w-full bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-sm px-4 py-3 text-sm font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] focus:outline-none focus:ring-1 focus:ring-[var(--palantir-active)]/30 transition-all uppercase"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            className="w-full bg-[var(--palantir-bg)] border border-[var(--palantir-border)] rounded-sm px-4 py-3 text-sm font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] focus:outline-none focus:ring-1 focus:ring-[var(--palantir-active)]/30 transition-all uppercase"
          />
        )
      ) : (
        <div className="min-h-[40px] flex items-center border-b border-transparent group-hover:border-[var(--palantir-border)] transition-all">
          <p className="text-[12px] font-bold text-[var(--palantir-text)] uppercase tracking-tight">
            {value && value !== "" ? value : <span className="text-[var(--palantir-muted)] opacity-30">NO_DATA_ENTRY</span>}
          </p>
        </div>
      )}
    </div>
  );
}
export default function DemographicsSection({ patient, onRefresh }: DemographicsSectionProps) {
  const [editing, setEditing] = useState(false);
  const chain = useMemo(() => (patient.address_chain as any) || {}, [patient.address_chain]);
  const [form, setForm] = useState<Partial<PatientInput>>({});
  const updatePatient = useUpdatePatient(patient.id);
  useEffect(() => {
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
      country_id: chain.country_id,
      state_id: chain.state_id,
      municipality_id: chain.municipality_id,
      parish_id: chain.parish_id,
      neighborhood_id: chain.neighborhood_id,
    });
  }, [patient]);
  const handleSave = () => {
    updatePatient.mutate(form as PatientInput, {
      onSuccess: () => { 
        setEditing(false); 
        onRefresh(); 
      }
    });
  };
  // Estados para opciones de dirección (integrar con hooks/API reales)
  const [countryOptions, setCountryOptions] = useState<{ value: string; label: string }[]>([]);
  const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([]);
  const [municipalityOptions, setMunicipalityOptions] = useState<{ value: string; label: string }[]>([]);
  const [parishOptions, setParishOptions] = useState<{ value: string; label: string }[]>([]);
  const [neighborhoodOptions, setNeighborhoodOptions] = useState<{ value: string; label: string }[]>([]);
  // Handlers para cascada jerárquica (convertir a number)
  const handleCountryChange = (countryId: string) => {
    setForm(prev => ({ ...prev, country_id: Number(countryId) || undefined, state_id: undefined, municipality_id: undefined, parish_id: undefined, neighborhood_id: undefined }));
    // Fetch states based on countryId
    setStateOptions([]);
  };
  const handleStateChange = (stateId: string) => {
    setForm(prev => ({ ...prev, state_id: Number(stateId) || undefined, municipality_id: undefined, parish_id: undefined, neighborhood_id: undefined }));
    // Fetch municipalities based on stateId
    setMunicipalityOptions([]);
  };
  const handleMunicipalityChange = (municipalityId: string) => {
    setForm(prev => ({ ...prev, municipality_id: Number(municipalityId) || undefined, parish_id: undefined, neighborhood_id: undefined }));
    // Fetch parishes based on municipalityId
    setParishOptions([]);
  };
  const handleParishChange = (parishId: string) => {
    setForm(prev => ({ ...prev, parish_id: Number(parishId) || undefined, neighborhood_id: undefined }));
    // Fetch neighborhoods based on parishId
    setNeighborhoodOptions([]);
  };
  return (
    <div className="border border-[var(--palantir-border)] rounded-sm overflow-hidden">
      <div className="bg-[var(--palantir-border)]/20 px-4 py-3 flex justify-between items-center border-b border-[var(--palantir-border)]">
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
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-3 py-1 border border-[var(--palantir-border)] text-[9px] font-mono text-[var(--palantir-muted)] hover:text-[var(--palantir-active)] hover:border-[var(--palantir-border)] transition-all">
            <PencilSquareIcon className="w-3 h-3" /> EDIT_RECORD
          </button>
        )}
      </div>
      
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (editing) handleSave();
        }}
        className="p-5 grid grid-cols-12 gap-x-8 gap-y-6"
      >
        <Field span={3} label="Identity_ID" value={String(form.national_id || "")} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, national_id: v }))} />
        <Field span={3} label="First_Name" value={form.first_name || ""} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, first_name: v }))} />
        <Field span={3} label="Last_Name" value={form.last_name || ""} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, last_name: v }))} />
        <Field span={3} label="Birth_Date" type="date" value={form.birthdate || ""} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, birthdate: v }))} />
        
        <Field span={3} label="Email_Address" value={form.email || ""} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, email: v }))} />
        <Field span={3} label="Contact_Line" value={form.contact_info || ""} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, contact_info: v }))} />
        <Field span={6} label="Birth_Location" value={`${form.birth_place || ''}`} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, birth_place: v }))} />
        
        <div className="col-span-12 h-[1px] bg-gradient-to-r from-[var(--palantir-border)] via-transparent to-transparent my-2" />
        <div className="col-span-12 flex items-center gap-2 mb-2">
          <MapPinIcon className="w-3 h-3 text-[var(--palantir-muted)]" />
          <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-[0.2em]">Geographic_Location_Data</span>
        </div>
        
        <Field span={3} label="Country" type="select" options={countryOptions} value={String(form.country_id || "")} editing={editing} onChange={handleCountryChange} />
        <Field span={3} label="State" type="select" options={stateOptions} value={String(form.state_id || "")} editing={editing} onChange={handleStateChange} />
        <Field span={3} label="Municipality" type="select" options={municipalityOptions} value={String(form.municipality_id || "")} editing={editing} onChange={handleMunicipalityChange} />
        <Field span={3} label="Parish" type="select" options={parishOptions} value={String(form.parish_id || "")} editing={editing} onChange={handleParishChange} />
        
        <Field span={6} label="Neighborhood" type="select" options={neighborhoodOptions} value={String(form.neighborhood_id || "")} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, neighborhood_id: Number(v) || undefined }))} />
        <Field span={6} label="Full_Address_Details" value={form.address ?? ""} editing={editing} multiline onChange={(v) => setForm(prev => ({ ...prev, address: v }))} />
      </form>
    </div>
  );
}