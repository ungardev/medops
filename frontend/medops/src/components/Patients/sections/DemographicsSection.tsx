// src/components/Patients/sections/DemographicsSection.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Patient, PatientInput } from "../../../types/patients";
import { useUpdatePatient } from "../../../hooks/patients/useUpdatePatient";
import { useLocationData } from "../../../hooks/settings/useLocationData";
import { 
  PencilSquareIcon, 
  CheckIcon, 
  XMarkIcon,
  MapPinIcon,
  UserCircleIcon,
  ExclamationCircleIcon,
  CpuChipIcon
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
  tooltip?: string;
  onChange?: (value: string) => void;
}
function Field({ label, value, type = "text", options = [], multiline = false, span = 3, editing, tooltip, onChange }: FieldProps) {
  const spanClasses = {
    3: "col-span-12 md:col-span-3",
    4: "col-span-12 md:col-span-4",
    6: "col-span-12 md:col-span-6",
    8: "col-span-12 md:col-span-8",
    9: "col-span-12 md:col-span-9",
    12: "col-span-12",
  };
  // Determinar estado de carga para select
  const isLoading = type === "select" && options.length === 0;
  return (
    <div className={`${spanClasses[span]} group`}>
      <label className="block text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest mb-1.5 group-focus-within:text-white/60 transition-colors">
        {label}
        {tooltip && <span className="ml-1 text-white/20 cursor-help" title={tooltip}>ⓘ</span>}
        {isLoading && <span className="ml-2 text-emerald-400 animate-pulse">●</span>}
      </label>
      {editing ? (
        type === "select" ? (
          <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-[11px] font-mono text-white focus:border-white/30 focus:outline-none transition-all uppercase"
            disabled={isLoading}
          >
            <option value="" className="bg-[#0a0a0a]">{isLoading ? 'CARGANDO...' : 'SELECCIONAR_OPCIÓN'}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0a0a0a]">
                {opt.label}
              </option>
            ))}
          </select>
        ) : multiline ? (
          <textarea
            rows={2}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-[11px] font-mono text-white focus:border-white/30 focus:outline-none transition-all uppercase resize-none"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-[11px] font-mono text-white focus:border-white/30 focus:outline-none transition-all uppercase"
          />
        )
      ) : (
        <div className="min-h-[32px] flex items-center border-b border-white/5 group-hover:border-white/10 transition-all animate-in fade-in duration-200">
          <p className="text-[11px] font-bold text-white/90 uppercase tracking-tight truncate">
            {value && value !== "" && value !== "undefined" ? value : <span className="text-white/10 italic">NULL_VAL</span>}
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const updatePatient = useUpdatePatient(patient.id);
  // ✅ NUEVO: Importar hooks de datos geográficos reales
  const {
    useCountries,
    useStates,
    useMunicipalities,
    useParishes,
    useNeighborhoods
  } = useLocationData();
  // ✅ NUEVO: Hooks para obtener datos reales
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: states = [], isLoading: loadingStates } = useStates(form.country_id);
  const { data: municipalities = [], isLoading: loadingMunicipalities } = useMunicipalities(form.state_id);
  const { data: parishes = [], isLoading: loadingParishes } = useParishes(form.municipality_id);
  const { data: neighborhoods = [], isLoading: loadingNeighborhoods } = useNeighborhoods(form.parish_id);
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
      address: patient.address ?? ""
    });
  }, [patient]);
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.first_name?.trim()) newErrors.first_name = "Nombre requerido";
    if (!form.last_name?.trim()) newErrors.last_name = "Apellido requerido";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Email inválido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSave = () => {
    if (!validateForm()) return;
    updatePatient.mutate(form as PatientInput, {
      onSuccess: () => { 
        setEditing(false); 
        setErrors({});
        onRefresh(); 
      },
      onError: () => setErrors({ general: "ERR_SYNC_FAILED" })
    });
  };
  // ✅ NUEVO: Opciones dinámicas con datos reales
  const countryOptions = useMemo(() => 
    countries.map(country => ({ value: String(country.id), label: country.name.toUpperCase() })),
    [countries]
  );
  const stateOptions = useMemo(() => 
    form.country_id ? states.map(state => ({ value: String(state.id), label: state.name.toUpperCase() })) : [],
    [states, form.country_id]
  );
  const municipalityOptions = useMemo(() => 
    form.state_id ? municipalities.map(municipality => ({ value: String(municipality.id), label: municipality.name.toUpperCase() })) : [],
    [municipalities, form.state_id]
  );
  const parishOptions = useMemo(() => 
    form.municipality_id ? parishes.map(parish => ({ value: String(parish.id), label: parish.name.toUpperCase() })) : [],
    [parishes, form.municipality_id]
  );
  const neighborhoodOptions = useMemo(() => 
    form.parish_id ? neighborhoods.map(neighborhood => ({ value: String(neighborhood.id), label: neighborhood.name.toUpperCase() })) : [],
    [neighborhoods, form.parish_id]
  );
  // ✅ NUEVO: Handlers con cascada real y validación
  const handleCountryChange = (v: string) => {
    const id = Number(v) || undefined;
    setForm(prev => ({ 
      ...prev, 
      country_id: id, 
      state_id: undefined, 
      municipality_id: undefined, 
      parish_id: undefined, 
      neighborhood_id: undefined 
    }));
  };
  const handleStateChange = (v: string) => {
    const id = Number(v) || undefined;
    setForm(prev => ({ 
      ...prev, 
      state_id: id, 
      municipality_id: undefined, 
      parish_id: undefined, 
      neighborhood_id: undefined 
    }));
  };
  const handleMunicipalityChange = (v: string) => {
    const id = Number(v) || undefined;
    setForm(prev => ({ 
      ...prev, 
      municipality_id: id, 
      parish_id: undefined, 
      neighborhood_id: undefined 
    }));
  };
  const handleParishChange = (v: string) => {
    const id = Number(v) || undefined;
    setForm(prev => ({ 
      ...prev, 
      parish_id: id, 
      neighborhood_id: undefined 
    }));
  };
  const handleNeighborhoodChange = (v: string) => {
    const id = Number(v) || undefined;
    setForm(prev => ({ ...prev, neighborhood_id: id }));
  };
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-sm overflow-hidden">
      <div className="bg-white/5 px-4 py-2.5 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-2">
          <UserCircleIcon className="w-4 h-4 text-white/40" />
          <span className="text-[10px] font-mono font-black text-white/60 uppercase tracking-widest">Subject_Identity_Core</span>
        </div>
        
        {editing ? (
          <div className="flex gap-3">
            <button 
              onClick={() => setEditing(false)} 
              className="px-3 py-1.5 text-[9px] font-mono text-white/40 hover:text-white transition-colors uppercase"
            >
              [ CANCELAR ]
            </button>
            <button 
              onClick={handleSave} 
              className="flex items-center gap-1.5 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[9px] font-bold rounded-sm border border-white/10 transition-all"
            >
              <CheckIcon className="w-3.5 h-3.5" /> 
              GUARDAR CAMBIOS
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setEditing(true)} 
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 border border-white/10 text-white text-[9px] font-mono text-white/60 hover:text-white hover:bg-white/10 transition-all rounded-sm"
          >
            <PencilSquareIcon className="w-3.5 h-3.5" /> 
            MODIFICAR REGISTRO
          </button>
        )}
      </div>
      
      {errors.general && (
        <div className="px-5 py-2 bg-red-500/10 border-b border-red-500/30 flex items-center gap-2">
          <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
          <span className="text-[10px] font-mono text-red-500">{errors.general}</span>
        </div>
      )}
      
      <form 
        onSubmit={(e) => { e.preventDefault(); if (editing) handleSave(); }}
        className="p-6 grid grid-cols-12 gap-x-6 gap-y-6"
      >
        <Field span={3} label="Identity_ID" value={String(form.national_id || "")} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, national_id: v }))} tooltip="Cédula o ID nacional" />
        <Field span={3} label="First_Name" value={form.first_name || ""} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, first_name: v }))} />
        <Field span={3} label="Middle_Name" value={form.middle_name || ""} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, middle_name: v }))} />
        <Field span={3} label="Last_Name" value={form.last_name || ""} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, last_name: v }))} />
        
        <Field span={3} label="Second_Last_Name" value={form.second_last_name || ""} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, second_last_name: v }))} />
        <Field span={3} label="Birth_Date" type="date" value={form.birthdate || ""} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, birthdate: v }))} />
        <Field span={6} label="Birth_Location" value={form.birth_place || ""} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, birth_place: v }))} />
        
        <Field span={4} label="Email_Address" type="email" value={form.email || ""} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, email: v }))} />
        <Field span={4} label="Contact_Line" value={form.contact_info || ""} editing={editing} onChange={(v) => setForm(prev => ({ ...prev, contact_info: v }))} />
        <Field span={4} label="Birth_Country" type="select" options={countryOptions} value={String(form.country_id || "")} editing={editing} onChange={handleCountryChange} />
        
        <div className="col-span-12 flex items-center gap-3 pt-4 opacity-30">
          <MapPinIcon className="w-3.5 h-3.5" />
          <span className="text-[8px] font-mono uppercase tracking-[0.3em]">GEOGRAPHIC_LOCATION_DATA</span>
          <div className="flex-1 h-[1px] bg-white/20" />
        </div>
        
        <Field span={3} label="Country" type="select" options={countryOptions} value={String(form.country_id || "")} editing={editing} onChange={handleCountryChange} />
        <Field span={3} label="State" type="select" options={stateOptions} value={String(form.state_id || "")} editing={editing} onChange={handleStateChange} />
        <Field span={3} label="Municipality" type="select" options={municipalityOptions} value={String(form.municipality_id || "")} editing={editing} onChange={handleMunicipalityChange} />
        <Field span={3} label="Parish" type="select" options={parishOptions} value={String(form.parish_id || "")} editing={editing} onChange={handleParishChange} />
        
        <Field span={4} label="Neighborhood" type="select" options={neighborhoodOptions} value={String(form.neighborhood_id || "")} editing={editing} onChange={handleNeighborhoodChange} />
        <Field span={8} label="Full_Address_Details" value={form.address || ""} editing={editing} multiline onChange={(v) => setForm(prev => ({ ...prev, address: v }))} />
      </form>
    </div>
  );
}