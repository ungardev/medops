// src/components/Patients/sections/DemographicsSection.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Patient, PatientInput } from "../../../types/patients";
import { useUpdatePatient } from "../../../hooks/patients/useUpdatePatient";
import { useLocationData } from "../../../hooks/settings/useLocationData";
import { LocationOption, normalizeLocationOption } from "../../../types/common";
import FieldSelect from "../../Settings/FieldSelect";
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
export default function DemographicsSection({ patient, onRefresh }: DemographicsSectionProps) {
  const [editing, setEditing] = useState(false);
  const chain = useMemo(() => (patient.address_chain as any) || {}, [patient.address_chain]);
  
  // ✅ NUEVO: Estado separado para neighborhood (igual que EditInstitutionModal)
  const [form, setForm] = useState<Partial<PatientInput> & { 
    neighborhood_name?: string 
  }>({});
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const updatePatient = useUpdatePatient(patient.id);
  const {
    useCountries,
    useStates,
    useMunicipalities,
    useParishes,
    useNeighborhoods
  } = useLocationData();
  // Hooks para obtener datos reales
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
  const isLoadingCountries = countriesResult.isLoading;
  const isLoadingStates = statesResult.isLoading;
  const isLoadingMunicipalities = municipalitiesResult.isLoading;
  const isLoadingParishes = parishesResult.isLoading;
  const isLoadingNeighborhoods = neighborhoodsResult.isLoading;
  const isLoadingAny = Boolean(
    countriesResult.isLoading || 
    statesResult.isLoading || 
    municipalitiesResult.isLoading || 
    parishesResult.isLoading || 
    neighborhoodsResult.isLoading
  );
  useEffect(() => {
    const neighborhood = patient.neighborhood || chain.neighborhood;
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
      neighborhood_id: neighborhood?.id || undefined,
      neighborhood_name: neighborhood?.name || "",
      address: patient.address ?? ""
    });
  }, [patient, chain]);
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
  const handleCountryChange = (v: string) => {
    const id = v ? Number(v) : undefined;
    setForm(prev => ({ 
      ...prev, 
      country_id: id, 
      state_id: undefined, 
      municipality_id: undefined, 
      parish_id: undefined, 
      neighborhood_id: undefined,
      neighborhood_name: ""
    }));
  };
  const handleStateChange = (v: string) => {
    const id = v ? Number(v) : undefined;
    setForm(prev => ({ 
      ...prev, 
      state_id: id, 
      municipality_id: undefined, 
      parish_id: undefined, 
      neighborhood_id: undefined,
      neighborhood_name: ""
    }));
  };
  const handleMunicipalityChange = (v: string) => {
    const id = v ? Number(v) : undefined;
    setForm(prev => ({ 
      ...prev, 
      municipality_id: id, 
      parish_id: undefined, 
      neighborhood_id: undefined,
      neighborhood_name: ""
    }));
  };
  const handleParishChange = (v: string) => {
    const id = v ? Number(v) : undefined;
    setForm(prev => ({ 
      ...prev, 
      parish_id: id, 
      neighborhood_id: undefined,
      neighborhood_name: ""
    }));
  };
  // ✅ FIX: Manejar neighborhood igual que EditInstitutionModal
  const handleNeighborhoodChange = (val: string) => {
    const existingNeighborhood = neighborhoods.find(
      n => n.name.toLowerCase() === val.toLowerCase()
    );
    
    if (existingNeighborhood) {
      setForm(prev => ({ 
        ...prev, 
        neighborhood_id: existingNeighborhood.id,
        neighborhood_name: val
      }));
    } else {
      setForm(prev => ({ 
        ...prev, 
        neighborhood_id: undefined,
        neighborhood_name: val
      }));
    }
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
              disabled={isLoadingAny}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[9px] font-bold rounded-sm border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckIcon className="w-3.5 h-3.5" /> 
              {isLoadingAny ? 'CARGANDO...' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setEditing(true)} 
            disabled={isLoadingAny}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white/5 border border-white/10 text-white text-[9px] font-mono text-white/60 hover:text-white hover:bg-white/10 transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PencilSquareIcon className="w-3.5 h-3.5" /> 
            {isLoadingAny ? 'CARGANDO...' : 'MODIFICAR REGISTRO'}
          </button>
        )}
      </div>
      
      {errors.general && (
        <div className="px-5 py-2 bg-red-500/10 border-b border-red-500/30 flex items-center gap-2">
          <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
          <span className="text-[10px] font-mono text-red-500">{errors.general}</span>
        </div>
      )}
      
      {isLoadingAny && (
        <div className="px-5 py-2 bg-blue-500/10 border-b border-blue-500/30 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent animate-spin"></div>
          <span className="text-[10px] font-mono text-blue-500">
            Cargando datos geográficos...
          </span>
        </div>
      )}
      
      <form 
        onSubmit={(e) => { e.preventDefault(); if (editing && !isLoadingAny) handleSave(); }}
        className="p-6 grid grid-cols-12 gap-x-6 gap-y-6"
      >
        {/* Campos básicos */}
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest mb-1.5">Identity_ID</label>
          <input
            type="text"
            value={form.national_id || ""}
            onChange={(e) => setForm(prev => ({ ...prev, national_id: e.target.value }))}
            disabled={!editing}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-[11px] font-mono text-white focus:border-white/30 focus:outline-none transition-all uppercase disabled:opacity-30"
          />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest mb-1.5">First_Name</label>
          <input
            type="text"
            value={form.first_name || ""}
            onChange={(e) => setForm(prev => ({ ...prev, first_name: e.target.value }))}
            disabled={!editing}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-[11px] font-mono text-white focus:border-white/30 focus:outline-none transition-all uppercase disabled:opacity-30"
          />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest mb-1.5">Last_Name</label>
          <input
            type="text"
            value={form.last_name || ""}
            onChange={(e) => setForm(prev => ({ ...prev, last_name: e.target.value }))}
            disabled={!editing}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-[11px] font-mono text-white focus:border-white/30 focus:outline-none transition-all uppercase disabled:opacity-30"
          />
        </div>
        
        <div className="col-span-12 md:col-span-3">
          <label className="block text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest mb-1.5">Birth_Date</label>
          <input
            type="date"
            value={form.birthdate || ""}
            onChange={(e) => setForm(prev => ({ ...prev, birthdate: e.target.value }))}
            disabled={!editing}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-[11px] font-mono text-white focus:border-white/30 focus:outline-none transition-all uppercase disabled:opacity-30"
          />
        </div>
        
        <div className="col-span-12 md:col-span-6">
          <label className="block text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest mb-1.5">Email_Address</label>
          <input
            type="email"
            value={form.email || ""}
            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            disabled={!editing}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-[11px] font-mono text-white focus:border-white/30 focus:outline-none transition-all uppercase disabled:opacity-30"
          />
        </div>
        
        <div className="col-span-12 md:col-span-6">
          <label className="block text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest mb-1.5">Contact_Line</label>
          <input
            type="text"
            value={form.contact_info || ""}
            onChange={(e) => setForm(prev => ({ ...prev, contact_info: e.target.value }))}
            disabled={!editing}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-[11px] font-mono text-white focus:border-white/30 focus:outline-none transition-all uppercase disabled:opacity-30"
          />
        </div>
        
        {/* Separador geográfico */}
        <div className="col-span-12 flex items-center gap-3 pt-4 opacity-30">
          <MapPinIcon className="w-3.5 h-3.5" />
          <span className="text-[8px] font-mono uppercase tracking-[0.3em]">GEOGRAPHIC_LOCATION_DATA</span>
          <div className="flex-1 h-[1px] bg-white/20" />
        </div>
        
        {/* ✅ FIX: Selectores geográficos - 5 campos en una fila con más ancho */}
        <div className="col-span-12 md:col-span-2">
          <FieldSelect
            label="Country"
            value={form.country_id || null}
            options={countries}
            onChange={handleCountryChange}
            disabled={!editing}
            loading={isLoadingCountries}
          />
        </div>
        
        <div className="col-span-12 md:col-span-2">
          <FieldSelect
            label="State"
            value={form.state_id || null}
            options={states}
            onChange={handleStateChange}
            disabled={!editing || !form.country_id}
            loading={isLoadingStates}
          />
        </div>
        
        <div className="col-span-12 md:col-span-2">
          <FieldSelect
            label="Municipality"
            value={form.municipality_id || null}
            options={municipalities}
            onChange={handleMunicipalityChange}
            disabled={!editing || !form.state_id}
            loading={isLoadingMunicipalities}
          />
        </div>
        
        <div className="col-span-12 md:col-span-2">
          <FieldSelect
            label="Parish"
            value={form.parish_id || null}
            options={parishes}
            onChange={handleParishChange}
            disabled={!editing || !form.municipality_id}
            loading={isLoadingParishes}
          />
        </div>
        
        {/* ✅ FIX: Campo Neighborhood igual que EditInstitutionModal */}
        <div className="col-span-12 md:col-span-4">
          <div className={`flex flex-col gap-1.5 ${(!form.parish_id || isLoadingNeighborhoods) ? 'opacity-30' : 'opacity-100'}`}>
            <label className="text-[8px] font-black font-mono text-white/30 uppercase tracking-[0.2em] flex items-center justify-between px-1">
              <span>Neighborhood / Sector</span>
              {isLoadingNeighborhoods && <CpuChipIcon className="w-2.5 h-2.5 animate-spin text-white/60" />}
            </label>
            <div className="relative">
              <input
                list="neighborhood-options"
                value={form.neighborhood_name || ""}
                disabled={!form.parish_id || isLoadingNeighborhoods || !editing}
                onChange={(e) => handleNeighborhoodChange(e.target.value)}
                placeholder={!form.parish_id ? "-- LOCKED --" : "-- TYPE_OR_SELECT --"}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-[11px] font-mono text-white focus:border-white/30 focus:outline-none transition-all uppercase disabled:opacity-30"
              />
              <datalist id="neighborhood-options">
                {neighborhoods.map((n) => (
                  <option key={n.id} value={n.name} />
                ))}
              </datalist>
              {form.neighborhood_name && !form.neighborhood_id && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                  <span className="text-[7px] font-black text-emerald-400 uppercase tracking-tighter animate-pulse">New_Entry</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* ✅ FIX: Full_Address_Details en línea separada con más tamaño */}
        <div className="col-span-12">
          <label className="block text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest mb-1.5">Full_Address_Details</label>
          <textarea
            rows={4}
            value={form.address || ""}
            onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
            disabled={!editing}
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-2 text-[11px] font-mono text-white focus:border-white/30 focus:outline-none transition-all uppercase resize-none disabled:opacity-30"
          />
        </div>
      </form>
    </div>
  );
}