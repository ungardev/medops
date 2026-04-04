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
  readOnly?: boolean;
}
const FITZPATRICK_OPTIONS = [
  { value: "I", label: "Tipo I - Muy clara" },
  { value: "II", label: "Tipo II - Clara" },
  { value: "III", label: "Tipo III - Intermedia" },
  { value: "IV", label: "Tipo IV - Mate" },
  { value: "V", label: "Tipo V - Morena" },
  { value: "VI", label: "Tipo VI - Negra" },
];
export default function DemographicsSection({ patient, onRefresh, readOnly = false }: DemographicsSectionProps) {
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
        onError: () => setErrors({ general: "Error al guardar los cambios" })
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
  
  const isDisabled = !editing || readOnly;
  
  const inputClass = "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2.5 text-[12px] text-white/80 disabled:opacity-40 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30";
  const labelClass = "block text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5";
  
  return (
    <div className="bg-white/5 border border-white/15 rounded-lg overflow-hidden">
      <div className="bg-white/5 px-5 py-3 flex justify-between items-center border-b border-white/15">
        <div className="flex items-center gap-3">
          <UserCircleIcon className="w-5 h-5 text-white/40" />
          <span className="text-[11px] font-medium text-white/70">Datos Personales</span>
        </div>
        
        {readOnly ? (
          <div className="text-[10px] text-white/30">Solo lectura</div>
        ) : editing ? (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-[10px] text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/5">Cancelar</button>
            <button onClick={handleSave} disabled={isLoadingAny} className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/25 text-emerald-400 text-[10px] font-medium rounded-lg disabled:opacity-50 transition-all">
              <CheckIcon className="w-3.5 h-3.5" /> 
              {isLoadingAny ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} disabled={isLoadingAny} className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 border border-white/15 text-[10px] text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-50 rounded-lg transition-all">
            <PencilSquareIcon className="w-3.5 h-3.5" /> 
            Editar
          </button>
        )}
      </div>
      
      {errors.general && (
        <div className="px-5 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
          <ExclamationCircleIcon className="w-4 h-4 text-red-400" />
          <span className="text-[11px] text-red-400">{errors.general}</span>
        </div>
      )}
      
      {isLoadingAny && (
        <div className="px-5 py-3 bg-blue-500/10 border-b border-blue-500/20 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[11px] text-blue-400">Cargando datos de ubicación...</span>
        </div>
      )}
      
      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-5 grid grid-cols-12 gap-x-4 gap-y-5">
        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>Cédula</label>
          <input type="text" value={form.national_id} onChange={(e) => setForm({...form, national_id: e.target.value})} disabled={isDisabled} className={inputClass} />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>Primer Nombre</label>
          <input type="text" value={form.first_name} onChange={(e) => setForm({...form, first_name: e.target.value})} disabled={isDisabled} className={inputClass} />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>Segundo Nombre</label>
          <input type="text" value={form.middle_name} onChange={(e) => setForm({...form, middle_name: e.target.value})} disabled={isDisabled} className={inputClass} />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>Primer Apellido</label>
          <input type="text" value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})} disabled={isDisabled} className={inputClass} />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>Segundo Apellido</label>
          <input type="text" value={form.second_last_name} onChange={(e) => setForm({...form, second_last_name: e.target.value})} disabled={isDisabled} className={inputClass} />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>Fecha de Nacimiento</label>
          <input type="date" value={form.birthdate} onChange={(e) => setForm({...form, birthdate: e.target.value})} disabled={isDisabled} className={inputClass} style={{colorScheme: 'dark'}} />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>Género</label>
          <select 
            value={form.gender} 
            onChange={(e) => setForm({...form, gender: e.target.value as any})}
            disabled={isDisabled}
            className={inputClass}
          >
            <option value="">Seleccionar</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="Other">Otro</option>
            <option value="Unknown">Desconocido</option>
          </select>
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>Correo Electrónico</label>
          <input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} disabled={isDisabled} className={inputClass} />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>Teléfono</label>
          <input type="text" value={form.contact_info} onChange={(e) => setForm({...form, contact_info: e.target.value})} disabled={isDisabled} className={inputClass} />
        </div>
        
        <div className="col-span-12 md:col-span-2">
          <label className={labelClass}>Tatuajes</label>
          <select 
            value={form.tattoo === null ? "" : form.tattoo.toString()} 
            onChange={(e) => setForm({...form, tattoo: e.target.value === "" ? null : e.target.value === "true"})} 
            disabled={isDisabled}
            className={inputClass}
          >
            <option value="">Seleccionar</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>
        
        <div className="col-span-12 md:col-span-4">
          <label className={labelClass}>Profesión</label>
          <input 
            type="text" 
            value={form.profession} 
            onChange={(e) => setForm({...form, profession: e.target.value})} 
            disabled={isDisabled} 
            placeholder="Profesión u ocupación..."
            className={inputClass} 
          />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className={labelClass}>Tipo de Piel (Fitzpatrick)</label>
          <select 
            value={form.skin_type} 
            onChange={(e) => setForm({...form, skin_type: e.target.value as any})} 
            disabled={isDisabled}
            className={inputClass}
          >
            <option value="">Seleccionar</option>
            {FITZPATRICK_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        
        <div className="col-span-12 flex items-center gap-3 pt-4 opacity-50">
          <MapPinIcon className="w-4 h-4" />
          <span className="text-[9px] font-medium uppercase tracking-wider">Ubicación Geográfica</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>
        
        <div className="col-span-12 md:col-span-2">
          <FieldSelect label="País" value={form.country_id} options={countries} onChange={handleCountryChange} disabled={isDisabled} loading={countriesResult.isLoading} />
        </div>
        
        <div className="col-span-12 md:col-span-2">
          <FieldSelect label="Estado" value={form.state_id} options={states} onChange={handleStateChange} disabled={isDisabled || !form.country_id} loading={statesResult.isLoading} />
        </div>
        
        <div className="col-span-12 md:col-span-2">
          <FieldSelect label="Municipio" value={form.municipality_id} options={municipalities} onChange={handleMunicipalityChange} disabled={isDisabled || !form.state_id} loading={municipalitiesResult.isLoading} />
        </div>
        
        <div className="col-span-12 md:col-span-2">
          <FieldSelect label="Parroquia" value={form.parish_id} options={parishes} onChange={handleParishChange} disabled={isDisabled || !form.municipality_id} loading={parishesResult.isLoading} />
        </div>
        
        <div className="col-span-12 md:col-span-4">
          <div className={`flex flex-col gap-1.5 ${(!form.parish_id || neighborhoodsResult.isLoading) ? 'opacity-40' : ''}`}>
            <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider flex justify-between px-1">
              <span>Urbanización / Sector</span>
              {neighborhoodsResult.isLoading && <CpuChipIcon className="w-3 h-3 animate-spin" />}
            </label>
            <div className="relative">
              <input list="neighborhood-options" value={form.neighborhood_name} disabled={!form.parish_id || isDisabled} onChange={(e) => handleNeighborhoodChange(e.target.value)} placeholder={!form.parish_id ? "Seleccione una parroquia" : "Escriba o seleccione..."} className={inputClass} />
              <datalist id="neighborhood-options">
                {neighborhoods.map((n) => <option key={n.id} value={n.name} />)}
              </datalist>
              {form.neighborhood_name && !form.neighborhood_id && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="text-[8px] font-medium text-emerald-400 animate-pulse">Nuevo</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-span-12">
          <label className={labelClass}>Dirección Completa</label>
          <textarea rows={3} value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} disabled={isDisabled} className={`${inputClass} resize-none`} />
        </div>
      </form>
    </div>
  );
}