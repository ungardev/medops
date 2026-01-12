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
      let finalId: number | null = null;
      
      const rawNB = settings.neighborhood;
      if (rawNB && typeof rawNB === 'object') {
        finalId = (rawNB as any).id;
      } else if (rawNB) {
        const cleaned = String(rawNB).replace(/[^0-9]/g, '');
        finalId = cleaned ? Number(cleaned) : null;
      }

      setFormData({
        name: settings.name || "",
        phone: settings.phone || "",
        tax_id: settings.tax_id || "",
        address: settings.address || "",
        neighborhood: finalId, 
        parishId: null,
        logo: null
      });
      
      setPreview(typeof settings.logo === 'string' ? settings.logo : null);
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

      // 1. Creación de sector si es nuevo (Igual que en pacientes)
      if (typeof formData.neighborhood === 'string') {
        if (!formData.parishId) {
          alert("SISTEMA: SE REQUIERE SELECCIONAR UNA PARROQUIA");
          return;
        }
        const newNB = await createNeighborhood(formData.neighborhood, formData.parishId);
        finalNeighborhoodId = newNB.id;
      } else {
        finalNeighborhoodId = formData.neighborhood;
      }

      /**
       * SOLUCIÓN CRÍTICA: 
       * Si hay un logo (File), usamos FormData. 
       * Si NO hay logo, enviamos un objeto JSON puro (como en DemographicsSection) 
       * para asegurar que Django procese la relación del neighborhood correctamente.
       */
      
      if (formData.logo) {
        const submissionData = new FormData();
        submissionData.append("name", formData.name);
        submissionData.append("phone", formData.phone);
        submissionData.append("tax_id", formData.tax_id);
        submissionData.append("address", formData.address);
        submissionData.append("neighborhood", String(finalNeighborhoodId));
        submissionData.append("logo", formData.logo);

        await updateInstitution(submissionData as any);
      } else {
        // Enviamos objeto plano exactamente igual que en DemographicsSection
        const plainData = {
          name: formData.name,
          phone: formData.phone,
          tax_id: formData.tax_id,
          address: formData.address,
          neighborhood: finalNeighborhoodId, // Enviado como número, no como string
        };
        await updateInstitution(plainData as any);
      }
      
      onClose();
      // Solo recargamos si es estrictamente necesario para el Layout
      window.location.reload(); 

    } catch (err) {
      console.error("CRITICAL_SYNC_ERROR", err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      <div className="bg-[var(--palantir-surface)] border border-[var(--palantir-border)] w-full max-w-4xl h-[90vh] shadow-2xl relative flex flex-col overflow-hidden font-mono">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-[var(--palantir-border)] bg-black/40">
          <div className="flex items-center gap-3">
            <GlobeAltIcon className="w-5 h-5 text-[var(--palantir-active)]" />
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--palantir-text)]">Institution_Profile_Editor</h2>
              <p className="text-[8px] text-[var(--palantir-muted)] uppercase tracking-widest">
                {isUpdating ? 'SYNCHRONIZING_DATA...' : 'CORE_IDENTITY_VAULT'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors">
            <XMarkIcon className="w-5 h-5 text-[var(--palantir-muted)]" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12 bg-black/5">
          <form onSubmit={handleSubmit} id="institution-form">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Logo Asset */}
              <div className="md:col-span-3 flex flex-col items-center">
                <div className="relative group w-32 h-32 border border-[var(--palantir-border)] bg-black/40 p-1">
                  {preview ? (
                    <img src={preview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                      <PhotoIcon className="w-10 h-10" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-[var(--palantir-active)]/50">
                    <span className="text-[9px] font-black uppercase text-white">Upload_Asset</span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
              </div>

              {/* Data Fields */}
              <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest block">Center_Name</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                    className="w-full bg-black/40 border border-[var(--palantir-border)] p-2.5 text-[11px] text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all uppercase"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest block">Phone_Line</label>
                  <input 
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-black/40 border border-[var(--palantir-border)] p-2.5 text-[11px] text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest block">Fiscal_Registry_ID</label>
                  <input 
                    type="text"
                    value={formData.tax_id}
                    onChange={e => setFormData({...formData, tax_id: e.target.value.toUpperCase()})}
                    className="w-full bg-black/40 border border-[var(--palantir-border)] p-2.5 text-[11px] text-[var(--palantir-active)] focus:border-[var(--palantir-active)] outline-none font-bold tracking-widest uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Geographics */}
            <div className="mt-12 pt-8 border-t border-[var(--palantir-border)]/20">
               <LocationSelector 
                initialNeighborhoodId={typeof formData.neighborhood === 'number' ? formData.neighborhood : undefined}
                onLocationChange={(val, parishId) => setFormData(prev => ({...prev, neighborhood: val, parishId: parishId}))}
              />
            </div>

            {/* Detailed Address */}
            <div className="mt-8 space-y-2">
              <label className="text-[9px] font-bold text-[var(--palantir-muted)] uppercase tracking-widest block">Full_Street_Address_Metadata</label>
              <textarea 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value.toUpperCase()})}
                rows={3}
                className="w-full bg-black/40 border border-[var(--palantir-border)] p-4 text-[11px] text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none resize-none uppercase"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--palantir-border)]/30 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${formData.neighborhood ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-[8px] font-black text-[var(--palantir-muted)] uppercase tracking-widest">
              {formData.neighborhood ? 'LOCATION_VERIFIED' : 'GEOGRAPHIC_CHAIN_INCOMPLETE'}
            </span>
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2 text-[10px] text-[var(--palantir-muted)] hover:text-white transition-colors uppercase">Abort</button>
            <button 
              form="institution-form" type="submit" disabled={isUpdating || !formData.neighborhood}
              className={`flex items-center gap-3 px-10 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-sm transition-all ${formData.neighborhood ? 'bg-[var(--palantir-active)] text-black hover:bg-white shadow-[0_0_20px_rgba(0,242,255,0.4)]' : 'bg-white/5 text-[var(--palantir-muted)] cursor-not-allowed'}`}
            >
              {isUpdating ? <ArrowPathIcon className="w-3 h-3 animate-spin" /> : <><ShieldCheckIcon className="w-4 h-4" /> COMMIT_SYNC</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
