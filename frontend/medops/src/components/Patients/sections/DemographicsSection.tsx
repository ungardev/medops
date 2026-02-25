// src/components/Patients/sections/DemographicsSection.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Patient, PatientInput } from "../../../types/patients";
import { useUpdatePatient } from "../../../hooks/patients/useUpdatePatient";
import { useLocationData } from "../../../hooks/settings/useLocationData";
import FieldSelect from "../../Settings/FieldSelect";
import { 
  PencilSquareIcon, 
  CheckIcon, 
  MapPinIcon,
  UserCircleIcon,
  ExclamationCircleIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";
interface DemographicsSectionProps {
  patient: Patient;
  onRefresh: () => void;
}
// ✅ Constantes para los nuevos campos
const FITZPATRICK_OPTIONS = [
  { value: "I", label: "TIPO I - Muy clara" },
  { value: "II", label: "TIPO II - Clara" },
  { value: "III", label: "TIPO III - Intermedia" },
  { value: "IV", label: "TIPO IV - Mate" },
  { value: "V", label: "TIPO V - Morena" },
  { value: "VI", label: "TIPO VI - Negra" },
];
export default function DemographicsSection({ patient, onRefresh }: DemographicsSectionProps) {
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const updatePatient = useUpdatePatient(patient.id);
  
  const { createNeighborhood, useCountries, useStates, useMunicipalities, useParishes, useNeighborhoods } = useLocationData();
  
  const patientLocationIds = useMemo(() => {
    const neighborhood = patient.neighborhood;
    const parish = neighborhood?.parish;
    const municipality = parish?.municipality;
    const state = municipality?.state;
    const country = state?.country;
    
    return {
      country_id: country?.id || null,
      state_id: state?.id || null,
      municipality_id: municipality?.id || null,
      parish_id: parish?.id || null,
      neighborhood_id: neighborhood?.id || null,
      neighborhood_name: neighborhood?.name || ""
    };
  }, [patient.neighborhood]);
  
  const getInitialForm = () => ({
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
    gender: patient.gender ?? "",
    // ✅ NUEVOS CAMPOS
    tattoo: patient.tattoo ?? null,
    profession: patient.profession ?? "",
    skin_type: patient.skin_type ?? "",
    country_id: null as number | null,
    state_id: null as number | null,
    municipality_id: null as number | null,
    parish_id: null as number | null,
    neighborhood_id: null as number | null,
    neighborhood_name: "",
    address: patient.address ?? ""
  });
  
  const [form, setForm] = useState(getInitialForm);
  
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      country_id: patientLocationIds.country_id,
      state_id: patientLocationIds.state_id,
      municipality_id: patientLocationIds.municipality_id,
      parish_id: patientLocationIds.parish_id,
      neighborhood_id: patientLocationIds.neighborhood_id,
      neighborhood_name: patientLocationIds.neighborhood_name
    }));
  }, [patientLocationIds]);
  
  const countriesResult = useCountries();
  const statesResult = useStates(form.country_id);
  const municipalitiesResult = useMunicipalities(form.state_id);
  const parishesResult = useParishes(form.municipality_id);
  const neighborhoodsResult = useNeighborhoods(form.parish_id);
  
  const countries = countriesResult.data || [];
  const states = statesResult.data || [];
  const municipalities = municipalitiesResult.data || [];
  const parishes = parishesResult.data || [];
  const neighborhoods = neighborhoodsResult.data || [];
  
  const isLoadingAny = countriesResult.isLoading || statesResult.isLoading || 
                       municipalitiesResult.isLoading || parishesResult.isLoading || 
                       neighborhoodsResult.isLoading;
  
  const handleSave = async () => {
    try {
      let finalNeighborhoodId = form.neighborhood_id;
      
      if (form.neighborhood_name && !form.neighborhood_id && form.parish_id) {
        const newNB = await createNeighborhood(form.neighborhood_name.trim(), form.parish_id);
        finalNeighborhoodId = newNB.id;
      }
      
      const payload: Partial<PatientInput> = {
        national_id: form.national_id || undefined,
        first_name: form.first_name,
        middle_name: form.middle_name || undefined,
        last_name: form.last_name,
        second_last_name: form.second_last_name || undefined,
        birthdate: form.birthdate || undefined,
        birth_place: form.birth_place || undefined,
        birth_country: form.birth_country || undefined,
        email: form.email || undefined,
        contact_info: form.contact_info || undefined,
        address: form.address || undefined,
        gender: (form.gender || undefined) as "F" | "Other" | "M" | "Unknown" | null | undefined,
        // ✅ NUEVOS CAMPOS
        tattoo: form.tattoo ?? undefined,
        profession: form.profession || undefined,
        skin_type: (form.skin_type || undefined) as "I" | "II" | "III" | "IV" | "V" | "VI" | null | undefined,
        neighborhood_id: finalNeighborhoodId || undefined,
      };
      
      updatePatient.mutate(payload, {
        onSuccess: () => { 
          setEditing(false); 
          setErrors({});
          onRefresh(); 
        },
        onError: () => setErrors({ general: "ERR_SYNC_FAILED" })
      });
    } catch (err) {
      setErrors({ general: "Error al guardar" });
    }
  };
  
  const handleCountryChange = (v: string) => {
    const id = v ? Number(v) : null;
    setForm(prev => ({ 
      ...prev, 
      country_id: id, 
      state_id: null, 
      municipality_id: null, 
      parish_id: null, 
      neighborhood_id: null,
      neighborhood_name: ""
    }));
  };
  
  const handleStateChange = (v: string) => {
    const id = v ? Number(v) : null;
    setForm(prev => ({ 
      ...prev, 
      state_id: id, 
      municipality_id: null, 
      parish_id: null, 
      neighborhood_id: null,
      neighborhood_name: ""
    }));
  };
  
  const handleMunicipalityChange = (v: string) => {
    const id = v ? Number(v) : null;
    setForm(prev => ({ 
      ...prev, 
      municipality_id: id, 
      parish_id: null, 
      neighborhood_id: null,
      neighborhood_name: ""
    }));
  };
  
  const handleParishChange = (v: string) => {
    const id = v ? Number(v) : null;
    setForm(prev => ({ 
      ...prev, 
      parish_id: id, 
      neighborhood_id: null,
      neighborhood_name: ""
    }));
  };
  
  const handleNeighborhoodChange = (val: string) => {
    const existing = neighborhoods.find(n => n.name.toLowerCase() === val.toLowerCase());
    if (existing) {
      setForm(prev => ({ ...prev, neighborhood_id: existing.id, neighborhood_name: val }));
    } else {
      setForm(prev => ({ ...prev, neighborhood_id: null, neighborhood_name: val }));
    }
  };
  
  return (
    <div className="bg-white/[0.05] border border-white/20 rounded-sm overflow-hidden">
      <div className="bg-white/10 px-4 py-2.5 flex justify-between items-center border-b border-white/20">
        <div className="flex items-center gap-2">
          <UserCircleIcon className="w-4 h-4 text-white/60" />
          <span className="text-[10px] font-mono font-bold text-white/80 uppercase tracking-widest">Subject_Identity_Core</span>
        </div>
        
        {editing ? (
          <div className="flex gap-3">
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-[10px] font-mono text-white/50 hover:text-white uppercase">[ CANCELAR ]</button>
            <button onClick={handleSave} disabled={isLoadingAny} className="flex items-center gap-1.5 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold rounded-sm border border-white/30 disabled:opacity-50">
              <CheckIcon className="w-3.5 h-3.5" /> 
              {isLoadingAny ? 'CARGANDO...' : 'GUARDAR'}
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} disabled={isLoadingAny} className="flex items-center gap-1.5 px-4 py-1.5 bg-white/10 border border-white/20 text-[10px] font-mono text-white/70 hover:text-white disabled:opacity-50">
            <PencilSquareIcon className="w-3.5 h-3.5" /> 
            MODIFICAR
          </button>
        )}
      </div>
      
      {errors.general && (
        <div className="px-5 py-2 bg-red-500/20 border-b border-red-500/40 flex items-center gap-2">
          <ExclamationCircleIcon className="w-4 h-4 text-red-400" />
          <span className="text-[11px] font-mono text-red-400">{errors.general}</span>
        </div>
      )}
      
      {isLoadingAny && (
        <div className="px-5 py-2 bg-blue-500/20 border-b border-blue-500/40 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent animate-spin"></div>
          <span className="text-[11px] font-mono text-blue-400">Cargando datos...</span>
        </div>
      )}
      
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 grid grid-cols-12 gap-x-4 gap-y-5">
        {/* ✅ FILA 1: Identity + Nombres */}
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[11px] font-bold text-white/60 uppercase mb-1.5">Identity_ID</label>
          <input type="text" value={form.national_id} onChange={(e) => setForm({...form, national_id: e.target.value})} disabled={!editing} className="w-full bg-white/10 border border-white/30 rounded-sm px-3 py-2.5 text-[13px] font-mono text-white disabled:opacity-40" />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[11px] font-bold text-white/60 uppercase mb-1.5">First_Name</label>
          <input type="text" value={form.first_name} onChange={(e) => setForm({...form, first_name: e.target.value})} disabled={!editing} className="w-full bg-white/10 border border-white/30 rounded-sm px-3 py-2.5 text-[13px] font-mono text-white disabled:opacity-40" />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[11px] font-bold text-white/60 uppercase mb-1.5">Middle_Name</label>
          <input type="text" value={form.middle_name} onChange={(e) => setForm({...form, middle_name: e.target.value})} disabled={!editing} className="w-full bg-white/10 border border-white/30 rounded-sm px-3 py-2.5 text-[13px] font-mono text-white disabled:opacity-40" />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[11px] font-bold text-white/60 uppercase mb-1.5">Last_Name</label>
          <input type="text" value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})} disabled={!editing} className="w-full bg-white/10 border border-white/30 rounded-sm px-3 py-2.5 text-[13px] font-mono text-white disabled:opacity-40" />
        </div>
        
        {/* ✅ FILA 2: Apellido + Birth */}
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[11px] font-bold text-white/60 uppercase mb-1.5">Second_Last_Name</label>
          <input type="text" value={form.second_last_name} onChange={(e) => setForm({...form, second_last_name: e.target.value})} disabled={!editing} className="w-full bg-white/10 border border-white/30 rounded-sm px-3 py-2.5 text-[13px] font-mono text-white disabled:opacity-40" />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[11px] font-bold text-white/60 uppercase mb-1.5">Birth_Date</label>
          <input type="date" value={form.birthdate} onChange={(e) => setForm({...form, birthdate: e.target.value})} disabled={!editing} className="w-full bg-white/10 border border-white/30 rounded-sm px-3 py-2.5 text-[13px] font-mono text-white disabled:opacity-40" style={{colorScheme: 'dark'}} />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[11px] font-bold text-white/60 uppercase mb-1.5">Gender</label>
          <select 
            value={form.gender} 
            onChange={(e) => setForm({...form, gender: e.target.value as any})}
            disabled={!editing}
            className="w-full bg-white/10 border border-white/30 rounded-sm px-3 py-2.5 text-[13px] font-mono text-white disabled:opacity-40"
          >
            <option value="">NO_DATA</option>
            <option value="M">MASCULINO</option>
            <option value="F">FEMENINO</option>
            <option value="Other">OTHER</option>
            <option value="Unknown">UNKNOWN</option>
          </select>
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[11px] font-bold text-white/60 uppercase mb-1.5">Email_Address</label>
          <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} disabled={!editing} className="w-full bg-white/10 border border-white/30 rounded-sm px-3 py-2.5 text-[13px] font-mono text-white disabled:opacity-40" />
        </div>
        
        {/* ✅ FILA 3: Contact_Line + Tattoo + Profession + Skin_Type (4 en misma fila) */}
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[11px] font-bold text-white/60 uppercase mb-1.5">Contact_Line</label>
          <input type="text" value={form.contact_info} onChange={(e) => setForm({...form, contact_info: e.target.value})} disabled={!editing} className="w-full bg-white/10 border border-white/30 rounded-sm px-3 py-2.5 text-[13px] font-mono text-white disabled:opacity-40" />
        </div>
        
        {/* TATTOO - Select */}
        <div className="col-span-12 md:col-span-2">
          <label className="block text-[11px] font-bold text-white/60 uppercase mb-1.5">Tattoo</label>
          <select 
            value={form.tattoo === null ? "" : form.tattoo.toString()} 
            onChange={(e) => setForm({...form, tattoo: e.target.value === "" ? null : e.target.value === "true"})} 
            disabled={!editing}
            className="w-full bg-white/10 border border-white/30 rounded-sm px-3 py-2.5 text-[13px] font-mono text-white disabled:opacity-40"
          >
            <option value="">NO_DATA</option>
            <option value="true">SÍ</option>
            <option value="false">NO</option>
          </select>
        </div>
        
        {/* PROFESSION - Text Input */}
        <div className="col-span-12 md:col-span-4">
          <label className="block text-[11px] font-bold text-white/60 uppercase mb-1.5">Profession</label>
          <input 
            type="text" 
            value={form.profession} 
            onChange={(e) => setForm({...form, profession: e.target.value})} 
            disabled={!editing} 
            placeholder="Profesión u ocupación..."
            className="w-full bg-white/10 border border-white/30 rounded-sm px-3 py-2.5 text-[13px] font-mono text-white disabled:opacity-40" 
          />
        </div>
        
        {/* SKIN_TYPE - Select con escala Fitzpatrick */}
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[11px] font-bold text-white/60 uppercase mb-1.5">Skin (Fitzpatrick)</label>
          <select 
            value={form.skin_type} 
            onChange={(e) => setForm({...form, skin_type: e.target.value as any})} 
            disabled={!editing}
            className="w-full bg-white/10 border border-white/30 rounded-sm px-3 py-2.5 text-[13px] font-mono text-white disabled:opacity-40"
          >
            <option value="">NO_DATA</option>
            {FITZPATRICK_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        {/* ✅ SECCIÓN: GEOGRAPHIC LOCATION */}
        <div className="col-span-12 flex items-center gap-3 pt-4 opacity-60">
          <MapPinIcon className="w-4 h-4" />
          <span className="text-[9px] font-mono uppercase tracking-[0.3em]">GEOGRAPHIC_LOCATION_DATA</span>
          <div className="flex-1 h-[1px] bg-white/30" />
        </div>
        
        {/* Location Fields - 5 campos por fila */}
        <div className="col-span-12 md:col-span-2">
          <FieldSelect label="Country" value={form.country_id} options={countries} onChange={handleCountryChange} disabled={!editing} loading={countriesResult.isLoading} />
        </div>
        
        <div className="col-span-12 md:col-span-2">
          <FieldSelect label="State" value={form.state_id} options={states} onChange={handleStateChange} disabled={!editing || !form.country_id} loading={statesResult.isLoading} />
        </div>
        
        <div className="col-span-12 md:col-span-2">
          <FieldSelect label="Municipality" value={form.municipality_id} options={municipalities} onChange={handleMunicipalityChange} disabled={!editing || !form.state_id} loading={municipalitiesResult.isLoading} />
        </div>
        
        <div className="col-span-12 md:col-span-2">
          <FieldSelect label="Parish" value={form.parish_id} options={parishes} onChange={handleParishChange} disabled={!editing || !form.municipality_id} loading={parishesResult.isLoading} />
        </div>
        
        <div className="col-span-12 md:col-span-4">
          <div className={`flex flex-col gap-1.5 ${(!form.parish_id || neighborhoodsResult.isLoading) ? 'opacity-40' : ''}`}>
            <label className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em] flex justify-between px-1">
              <span>Neighborhood / sector</span>
              {neighborhoodsResult.isLoading && <CpuChipIcon className="w-3 h-3 animate-spin" />}
            </label>
            <div className="relative">
              <input list="neighborhood-options" value={form.neighborhood_name} disabled={!form.parish_id || !editing} onChange={(e) => handleNeighborhoodChange(e.target.value)} placeholder={!form.parish_id ? "-- LOCKED --" : "-- TYPE_OR_SELECT --"} className="w-full bg-white/10 border border-white/30 rounded-sm px-3 py-2.5 text-[13px] font-mono text-white disabled:opacity-40" />
              <datalist id="neighborhood-options">
                {neighborhoods.map((n) => <option key={n.id} value={n.name} />)}
              </datalist>
              {form.neighborhood_name && !form.neighborhood_id && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="text-[8px] font-bold text-emerald-400 uppercase animate-pulse">New_Entry</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* ✅ DIRECCIÓN */}
        <div className="col-span-12">
          <label className="block text-[11px] font-bold text-white/60 uppercase mb-1.5">Full_Address_Details</label>
          <textarea rows={3} value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} disabled={!editing} className="w-full bg-white/10 border border-white/30 rounded-sm px-3 py-2.5 text-[13px] font-mono text-white disabled:opacity-40" />
        </div>
      </form>
    </div>
  );
}