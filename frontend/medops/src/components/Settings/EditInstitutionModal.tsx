// src/components/Settings/EditInstitutionModal.tsx
import React, { useState, useEffect } from "react";
import { 
  XMarkIcon, 
  ArrowPathIcon, 
  PhotoIcon, 
  ShieldCheckIcon,
  GlobeAltIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";
import { useInstitutionSettings } from "../../hooks/settings/useInstitutionSettings";
import { useLocationData } from "../../hooks/settings/useLocationData";
import FieldSelect from "./FieldSelect";
interface Props {
  open: boolean;
  onClose: () => void;
  institution?: any;
}
export default function EditInstitutionModal({ open, onClose, institution }: Props) {
  const { data: settings, updateInstitution, isUpdating } = useInstitutionSettings();
  const { createNeighborhood, useCountries, useStates, useMunicipalities, useParishes, useNeighborhoods } = useLocationData();
  
  // ✅ FIX: Usar institution prop si está disponible, si no usar settings
  const dataSource = institution || settings;
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    tax_id: "",
    address: "",
    countryId: null as number | null,
    stateId: null as number | null,
    municipalityId: null as number | null,
    parishId: null as number | null,
    neighborhoodId: null as number | null,
    neighborhoodName: "" as string,
    logo: null as File | null
  });
  
  const [preview, setPreview] = useState<string | null>(null);
  
  const countriesResult = useCountries();
  const statesResult = useStates(formData.countryId);
  const municipalitiesResult = useMunicipalities(formData.stateId);
  const parishesResult = useParishes(formData.municipalityId);
  const neighborhoodsResult = useNeighborhoods(formData.parishId);
  
  const countries = countriesResult.data || [];
  const states = statesResult.data || [];
  const municipalities = municipalitiesResult.data || [];
  const parishes = parishesResult.data || [];
  const neighborhoods = neighborhoodsResult.data || [];
  
  const isLoadingCountries = countriesResult.isLoading;
  const isLoadingStates = statesResult.isLoading;
  const isLoadingMunis = municipalitiesResult.isLoading;
  const loadingParishes = parishesResult.isLoading;
  const loadingHoods = neighborhoodsResult.isLoading;
  
  const isLoadingAny = Boolean(
    countriesResult.isLoading || 
    statesResult.isLoading || 
    municipalitiesResult.isLoading || 
    parishesResult.isLoading || 
    neighborhoodsResult.isLoading
  );
  // ✅ FIX: Usar dataSource en lugar de settings
  useEffect(() => {
    if (open && dataSource) {
      const neighborhood = dataSource.neighborhood;
      setFormData({
        name: dataSource.name || "",
        phone: dataSource.phone || "",
        tax_id: dataSource.tax_id || "",
        address: dataSource.address || "",
        countryId: (neighborhood as any)?.parish?.municipality?.state?.country?.id || null,
        stateId: (neighborhood as any)?.parish?.municipality?.state?.id || null,
        municipalityId: (neighborhood as any)?.parish?.municipality?.id || null,
        parishId: (neighborhood as any)?.parish?.id || null,
        neighborhoodId: (neighborhood as any)?.id || null,
        neighborhoodName: (neighborhood as any)?.name || "",
        logo: null
      });
      
      // ✅ FIX: Verificar si existe logo y es string, igual que ActiveInstitutionCard
      if (dataSource.logo && typeof dataSource.logo === 'string') {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const fullUrl = dataSource.logo.startsWith('http') 
          ? dataSource.logo 
          : `${API_BASE}${dataSource.logo.startsWith('/') ? '' : '/'}${dataSource.logo}`;
        setPreview(fullUrl);
      } else {
        setPreview(null);
      }
    }
  }, [open, dataSource]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }));
      setPreview(URL.createObjectURL(file));
    }
  };
  const handleCountryChange = (val: string) => {
    const id = val ? Number(val) : null;
    setFormData(prev => ({ ...prev, countryId: id, stateId: null, municipalityId: null, parishId: null, neighborhoodId: null, neighborhoodName: "" }));
  };
  const handleStateChange = (val: string) => {
    const id = val ? Number(val) : null;
    setFormData(prev => ({ ...prev, stateId: id, municipalityId: null, parishId: null, neighborhoodId: null, neighborhoodName: "" }));
  };
  const handleMunicipalityChange = (val: string) => {
    const id = val ? Number(val) : null;
    setFormData(prev => ({ ...prev, municipalityId: id, parishId: null, neighborhoodId: null, neighborhoodName: "" }));
  };
  const handleParishChange = (val: string) => {
    const id = val ? Number(val) : null;
    setFormData(prev => ({ ...prev, parishId: id, neighborhoodId: null, neighborhoodName: "" }));
  };
  const handleNeighborhoodChange = (val: string) => {
    const existingNeighborhood = neighborhoods.find(n => n.name.toLowerCase() === val.toLowerCase());
    if (existingNeighborhood) {
      setFormData(prev => ({ ...prev, neighborhoodId: existingNeighborhood.id, neighborhoodName: val }));
    } else {
      setFormData(prev => ({ ...prev, neighborhoodId: null, neighborhoodName: val }));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.countryId || !formData.stateId || !formData.municipalityId || !formData.parishId || !formData.neighborhoodName.trim()) {
      console.error("Missing required fields");
      return;
    }
    
    try {
      let finalNeighborhoodId: number;
      
      if (formData.neighborhoodId) {
        finalNeighborhoodId = formData.neighborhoodId;
      } else {
        const newNB = await createNeighborhood(formData.neighborhoodName.trim(), formData.parishId);
        finalNeighborhoodId = newNB.id;
      }
      
      await updateInstitution({
        name: formData.name.toUpperCase(),
        phone: formData.phone,
        tax_id: formData.tax_id.toUpperCase(),
        address: formData.address.toUpperCase(),
        neighborhood: finalNeighborhoodId,
        logo: formData.logo
      });
      
      onClose();
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      console.error("CRITICAL_SYNC_ERROR:", err);
    }
  };
  const inputStyles = "w-full bg-black/40 border border-white/20 rounded-sm px-4 py-3 text-[13px] text-white font-mono focus:outline-none focus:border-emerald-500/50 transition-all";
  const labelStyles = "text-[11px] font-bold text-white/70 uppercase tracking-[0.1em] mb-2 block";
  const sectionStyles = "bg-white/[0.02] border border-white/10 rounded-sm p-5 space-y-4";
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-[#0a0a0b] border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 border border-emerald-400/30">
              <GlobeAltIcon className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-white">
                INSTITUTION_PROFILE_EDITOR
              </h3>
              <p className="text-[10px] font-mono text-white/50 uppercase">Identity Vault Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6 space-y-5">
          {isLoadingAny && (
            <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/30 flex items-center gap-3 rounded-sm">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent animate-spin"></div>
              <span className="text-[10px] font-mono text-blue-500">
                Cargando datos geográficos...
              </span>
            </div>
          )}
          
          {/* Logo Section - ✅ FIX: Fondo blanco como los otros componentes */}
          <div className={sectionStyles}>
            <div className="flex items-center gap-2 mb-4">
              <GlobeAltIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400">
                INSTITUTION_LOGO
              </h3>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              {/* ✅ FIX: Contenedor con fondo blanco igual que InstitutionCard */}
              <div className="relative group w-32 h-32 border border-gray-200 bg-white p-1 overflow-hidden">
                {preview ? (
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <BuildingOfficeIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-emerald-400/50">
                  <span className="text-[9px] font-black uppercase text-white">UPDATE</span>
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-mono text-white/50 uppercase">CURRENT_ID: {dataSource?.id || 'UNKNOWN'}</p>
              </div>
            </div>
          </div>
          {/* Identity Section */}
          <div className={sectionStyles}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400">
                IDENTITY_PROTOCOL
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyles}>Center Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                  className={inputStyles}
                  required
                />
              </div>
              <div>
                <label className={labelStyles}>Phone</label>
                <input 
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className={inputStyles}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelStyles}>Fiscal ID (RIF)</label>
                <input 
                  type="text"
                  value={formData.tax_id}
                  onChange={e => setFormData({...formData, tax_id: e.target.value.toUpperCase()})}
                  className={`${inputStyles} font-bold tracking-widest text-emerald-400`}
                />
              </div>
            </div>
          </div>
          {/* Geographic Section */}
          <div className={sectionStyles}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-400">
                GEOGRAPHIC_HIERARCHY
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <FieldSelect
                  label="Country"
                  value={formData.countryId}
                  options={countries}
                  onChange={handleCountryChange}
                  disabled={false}
                  loading={isLoadingCountries}
                />
              </div>
              
              <div>
                <FieldSelect
                  label="State"
                  value={formData.stateId}
                  options={states}
                  onChange={handleStateChange}
                  disabled={!formData.countryId}
                  loading={isLoadingStates}
                />
              </div>
              
              <div>
                <FieldSelect
                  label="Municipality"
                  value={formData.municipalityId}
                  options={municipalities}
                  onChange={handleMunicipalityChange}
                  disabled={!formData.stateId}
                  loading={isLoadingMunis}
                />
              </div>
              
              <div>
                <FieldSelect
                  label="Parish"
                  value={formData.parishId}
                  options={parishes}
                  onChange={handleParishChange}
                  disabled={!formData.municipalityId}
                  loading={loadingParishes}
                />
              </div>
              
              <div className={(!formData.parishId || loadingHoods) ? 'opacity-30' : 'opacity-100'}>
                <label className={labelStyles}>Neighborhood</label>
                <input
                  list="neighborhood-options"
                  value={formData.neighborhoodName}
                  disabled={!formData.parishId || loadingHoods}
                  onChange={(e) => handleNeighborhoodChange(e.target.value)}
                  placeholder={!formData.parishId ? "--" : "-- SELECT --"}
                  className={inputStyles}
                />
                <datalist id="neighborhood-options">
                  {neighborhoods.map((n) => (
                    <option key={n.id} value={n.name} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>
          {/* Address Section */}
          <div className={sectionStyles}>
            <label className={labelStyles}>Address</label>
            <textarea 
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})}
              rows={3}
              className={`${inputStyles} h-20 resize-none`}
            />
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              formData.countryId && formData.stateId && formData.municipalityId && 
              formData.parishId && formData.neighborhoodName 
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                : 'bg-amber-500 animate-pulse'
            }`} />
            <span className="text-[8px] font-mono font-bold text-white/30 uppercase tracking-widest">
              {formData.countryId && formData.stateId && formData.municipalityId && 
               formData.parishId && formData.neighborhoodName 
                ? 'GEO_CHAIN_STABLE' 
                : 'GEO_CHAIN_BROKEN'}
            </span>
          </div>
          
          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isUpdating || !formData.countryId || !formData.stateId || 
                       !formData.municipalityId || !formData.parishId || !formData.neighborhoodName.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-sm text-[11px] font-bold uppercase tracking-widest text-white bg-emerald-500/20 border border-white/20 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}