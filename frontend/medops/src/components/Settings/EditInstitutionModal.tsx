// src/components/settings/EditInstitutionModal.tsx
import React, { useState, useEffect } from "react";
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
      // Normalización robusta del neighborhood inicial
      const rawNB = settings.neighborhood;
      const finalId = rawNB && typeof rawNB === 'object' ? (rawNB as any).id : rawNB;

      setFormData({
        name: settings.name || "",
        phone: settings.phone || "",
        tax_id: settings.tax_id || "",
        address: settings.address || "",
        neighborhood: finalId, 
        parishId: null,
        logo: null
      });
      
      // Corregir icono roto: Asegurar que la URL sea absoluta
      if (typeof settings.logo === 'string' && settings.logo) {
        const fullUrl = settings.logo.startsWith('http') 
          ? settings.logo 
          : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${settings.logo}`;
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

      // 1. Manejo de sectores nuevos (creación previa)
      if (typeof formData.neighborhood === 'string') {
        const newNB = await createNeighborhood(formData.neighborhood, formData.parishId!);
        finalNeighborhoodId = newNB.id;
      } else {
        finalNeighborhoodId = formData.neighborhood;
      }

      // 2. ENVÍO DE DATOS (JSON): Igual que en DemographicsSection para asegurar persistencia
      const plainData = {
        name: formData.name.toUpperCase(),
        phone: formData.phone,
        tax_id: formData.tax_id.toUpperCase(),
        address: formData.address.toUpperCase(),
        neighborhood: finalNeighborhoodId, // Enviado como número
      };
      
      await updateInstitution(plainData);

      // 3. ENVÍO DE LOGO (Solo si cambió): En una petición separada para evitar conflictos
      if (formData.logo instanceof File) {
        const logoForm = new FormData();
        logoForm.append("logo", formData.logo);
        await updateInstitution(logoForm);
      }
      
      onClose();
      // Pequeño delay antes de recargar para que el backend asiente los archivos
      setTimeout(() => window.location.reload(), 500);

    } catch (err) {
      console.error("ERROR_EN_SINCRONIZACION:", err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="bg-[var(--palantir-surface)] border border-[var(--palantir-border)] w-full max-w-4xl h-[90vh] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-[var(--palantir-border)] bg-black/40 shrink-0">
          <div className="flex items-center gap-3">
            <GlobeAltIcon className="w-5 h-5 text-[var(--palantir-active)]" />
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--palantir-text)]">Institution_Profile_Editor</h2>
              <p className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
                {isUpdating ? 'SYNCHRONIZING_CORE_DATA...' : 'IDENTITY_VAULT_ACTIVE'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors">
            <XMarkIcon className="w-5 h-5 text-[var(--palantir-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-black/5">
          <form onSubmit={handleSubmit} id="institution-form">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Logo Asset */}
              <div className="md:col-span-3 flex flex-col items-center gap-4">
                <div className="relative group w-32 h-32 border border-[var(--palantir-border)] bg-black/40 p-1 overflow-hidden">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20 border border-dashed border-[var(--palantir-border)]">
                      <PhotoIcon className="w-8 h-8" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-[var(--palantir-active)]/50">
                    <span className="text-[9px] font-black uppercase text-white">Update_Asset</span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
              </div>

              {/* Information Fields */}
              <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-[var(--palantir-muted)] uppercase px-1">Center_Identity_Name</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                    className="w-full bg-black/40 border border-[var(--palantir-border)] p-2.5 text-[11px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none uppercase"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-[var(--palantir-muted)] uppercase px-1">Comm_Phone_Line</label>
                  <input 
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-black/40 border border-[var(--palantir-border)] p-2.5 text-[11px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] font-mono font-bold text-[var(--palantir-muted)] uppercase px-1">Fiscal_Identifier (RIF/NIT)</label>
                  <input 
                    type="text"
                    value={formData.tax_id}
                    onChange={e => setFormData({...formData, tax_id: e.target.value.toUpperCase()})}
                    className="w-full bg-black/40 border border-[var(--palantir-border)] p-2.5 text-[11px] font-mono text-[var(--palantir-active)] focus:border-[var(--palantir-active)] outline-none font-bold tracking-widest uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Geography Section */}
            <div className="mt-12 pt-8 border-t border-[var(--palantir-border)]/20">
               <LocationSelector 
                initialNeighborhoodId={typeof formData.neighborhood === 'number' ? formData.neighborhood : undefined}
                onLocationChange={(val, parishId) => setFormData(prev => ({...prev, neighborhood: val, parishId: parishId}))}
              />
            </div>

            {/* Address Metadata */}
            <div className="mt-8 space-y-2">
              <label className="text-[9px] font-mono font-bold text-[var(--palantir-muted)] uppercase px-1">Local_Address_Metadata</label>
              <textarea 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})}
                rows={3}
                className="w-full bg-black/40 border border-[var(--palantir-border)] p-4 text-[11px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none resize-none uppercase"
              />
            </div>
          </form>
        </div>

        {/* Action Footer */}
        <div className="p-6 border-t border-[var(--palantir-border)]/30 bg-black/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${formData.neighborhood ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-[8px] font-mono font-black text-[var(--palantir-muted)] uppercase tracking-widest">
              {formData.neighborhood ? 'GEOGRAPHIC_CHAIN_STABLE' : 'GEOGRAPHIC_CHAIN_BROKEN'}
            </span>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2 text-[10px] font-mono font-bold text-[var(--palantir-muted)] hover:text-white transition-colors uppercase">Abort</button>
            <button 
              form="institution-form" type="submit" disabled={isUpdating || !formData.neighborhood}
              className={`flex items-center gap-3 px-10 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm transition-all ${formData.neighborhood ? 'bg-[var(--palantir-active)] text-black hover:bg-white shadow-[0_0_20px_rgba(0,242,255,0.3)]' : 'bg-white/5 text-[var(--palantir-muted)] cursor-not-allowed'}`}
            >
              {isUpdating ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <><ShieldCheckIcon className="w-4 h-4" /> Synchronize</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
