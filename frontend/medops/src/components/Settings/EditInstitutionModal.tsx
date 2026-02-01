// src/components/Settings/EditInstitutionModal.tsx
import React, { useState, useEffect } from "react";
import EliteModal from "../Common/EliteModal";
import { 
  XMarkIcon, 
  ArrowPathIcon, 
  PhotoIcon, 
  ShieldCheckIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";
import { useInstitutionSettings } from "../../hooks/settings/useInstitutionSettings";
import { useLocationData } from "../../hooks/settings/useLocationData";
import LocationSelector from "./LocationSelector";
interface Props {
  open: boolean;
  onClose: () => void;
}
export default function EditInstitutionModal({ open, onClose }: Props) {
  const { data: settings, updateInstitution, isUpdating } = useInstitutionSettings();
  const { createNeighborhood } = useLocationData();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    tax_id: "",
    address: "",
    neighborhood: null as number | string | null,
    parishId: null as number | null,
    logo: null as File | null
  });
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (open && settings) {
      const rawNB = settings.neighborhood;
      const finalId = rawNB && typeof rawNB === 'object' ? (rawNB as any).id : rawNB;
      setFormData({
        name: settings.name || "",
        phone: settings.phone || "",
        tax_id: settings.tax_id || "",
        address: settings.address || "",
        neighborhood: finalId || null, 
        parishId: (rawNB as any)?.parish?.id || null,
        logo: null
      });
      
      if (settings.logo && typeof settings.logo === 'string') {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const fullUrl = settings.logo.startsWith('http') 
          ? settings.logo 
          : `${API_BASE}${settings.logo.startsWith('/') ? '' : '/'}${settings.logo}`;
          
        setPreview(fullUrl);
      } else {
        setPreview(null);
      }
    }
  }, [open, settings]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }));
      setPreview(URL.createObjectURL(file));
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.neighborhood) return;
    try {
      let finalNeighborhoodId: number;
      if (typeof formData.neighborhood === 'string') {
        const newNB = await createNeighborhood(formData.neighborhood, formData.parishId!);
        finalNeighborhoodId = newNB.id;
      } else {
        finalNeighborhoodId = formData.neighborhood;
      }
      await updateInstitution({
        name: formData.name.toUpperCase(),
        phone: formData.phone,
        tax_id: formData.tax_id.toUpperCase(),
        address: formData.address.toUpperCase(),
        neighborhood: Number(finalNeighborhoodId),
        logo: formData.logo
      });
      
      onClose();
      setTimeout(() => window.location.reload(), 600);
    } catch (err) {
      console.error("CRITICAL_SYNC_ERROR:", err);
    }
  };
  const inputStyles = "w-full bg-black/40 border border-white/10 rounded-sm p-2.5 text-[11px] font-mono text-white focus:outline-none focus:border-emerald-500/50 transition-all uppercase";
  const labelStyles = "text-[9px] font-mono font-bold text-white/30 uppercase tracking-[0.1em] px-1 mb-2 block";
  const sectionStyles = "bg-[#0a0a0a] border border-white/10 rounded-sm p-4 space-y-4";
  return (
    <EliteModal
      open={open}
      onClose={onClose}
      title="INSTITUTION_PROFILE_EDITOR"
      subtitle="IDENTITY_VAULT_CONFIGURATION_SYSTEM"
      maxWidth="4xl"
    >
      <div className="space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
        <form onSubmit={handleSubmit} id="institution-form">
          <div className={sectionStyles}>
            <div className="flex items-center gap-2 mb-4">
              <GlobeAltIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400">
                INSTITUTION_LOGO_ASSET_MANAGER
              </h3>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <div className="relative group w-32 h-32 border border-white/10 bg-black/40 p-1 overflow-hidden">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20 border border-dashed border-white/20">
                    <PhotoIcon className="w-8 h-8" />
                  </div>
                )}
                <label className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-emerald-400/50">
                  <span className="text-[9px] font-black uppercase text-white">UPDATE_ASSET</span>
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
              </div>
              <div className="text-center">
                <p className="text-[8px] font-mono text-white/50 uppercase">CURRENT_ASSET_ID: {settings?.id || 'UNKNOWN'}</p>
              </div>
            </div>
          </div>
          <div className={sectionStyles}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400">
                INSTITUTION_IDENTITY_PROTOCOL
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelStyles}>CENTER_IDENTITY_NAME</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                  className={inputStyles}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={labelStyles}>COMMUNICATION_PHONE_LINE</label>
                <input 
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className={inputStyles}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className={labelStyles}>FISCAL_IDENTIFIER_REGISTRY</label>
                <input 
                  type="text"
                  value={formData.tax_id}
                  onChange={e => setFormData({...formData, tax_id: e.target.value.toUpperCase()})}
                  className={`${inputStyles} font-bold tracking-widest text-emerald-400`}
                />
              </div>
            </div>
          </div>
          <div className={sectionStyles}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-400">
                GEOGRAPHIC_HIERARCHY_SYSTEM
              </h3>
            </div>
            
            <LocationSelector 
              initialData={{
                countryId: (settings?.neighborhood as any)?.parish?.municipality?.state?.country?.id,
                stateId: (settings?.neighborhood as any)?.parish?.municipality?.state?.id,
                municipalityId: (settings?.neighborhood as any)?.parish?.municipality?.id,
                parishId: (settings?.neighborhood as any)?.parish?.id,
                neighborhoodId: (settings?.neighborhood as any)?.id
              }}
              onLocationChange={(val, parishId) => setFormData(prev => ({...prev, neighborhood: val, parishId: parishId}))}
            />
          </div>
          <div className={sectionStyles}>
            <div className="space-y-2">
              <label className={labelStyles}>LOCAL_ADDRESS_METADATA</label>
              <textarea 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})}
                rows={3}
                className={`${inputStyles} h-20 resize-none`}
              />
            </div>
          </div>
        </form>
      </div>
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${formData.neighborhood ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
          <span className="text-[8px] font-mono font-black text-white/30 uppercase tracking-widest">
            {formData.neighborhood ? 'GEOGRAPHIC_CHAIN_STABLE' : 'GEOGRAPHIC_CHAIN_BROKEN'}
          </span>
        </div>
        <div className="flex gap-4">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-2 text-[10px] font-mono font-bold text-white/30 hover:text-white transition-colors uppercase"
          >
            ABORT_CHANGES
          </button>
          <button 
            form="institution-form" 
            type="submit" 
            disabled={isUpdating || !formData.neighborhood}
            className={`flex items-center gap-3 px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm transition-all font-mono ${formData.neighborhood ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}
          >
            {isUpdating ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <ShieldCheckIcon className="w-4 h-4" />}
            {isUpdating ? 'SYNCHRONIZING...' : 'SYNCHRONIZE_DATA'}
          </button>
        </div>
      </div>
    </EliteModal>
  );
}