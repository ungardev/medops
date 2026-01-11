import React, { useState, useEffect } from "react";
import { 
  XMarkIcon, 
  ArrowPathIcon, 
  PhotoIcon, 
  ShieldCheckIcon,
  GlobeAltIcon
} from "@heroicons/react/24/outline";

// Hooks
import { useInstitutionSettings } from "../../hooks/settings/useInstitutionSettings";

// Components
import LocationSelector from "./LocationSelector";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function EditInstitutionModal({ open, onClose }: Props) {
  const { data: settings, updateInstitution, isUpdating } = useInstitutionSettings();
  
  // Estado local del formulario
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    tax_id: "",
    address: "",
    neighborhood: null as number | null,
    logo: null as File | null
  });

  const [preview, setPreview] = useState<string | null>(null);

  /**
   * 🛡️ NUCLEAR DATA HYDRATION (Elite Tier)
   * Extrae y purifica el ID de ubicación del objeto settings.
   * Si el backend envía ":1" o un objeto, lo reducimos a un número real.
   */
  useEffect(() => {
    if (open && settings) {
      let finalId: number | null = null;

      // 1. Extraer ID si es objeto o valor directo
      const rawId = typeof settings.neighborhood === 'object' 
        ? settings.neighborhood?.id 
        : settings.neighborhood;

      // 2. Sanitizar contra basura ":1" o "undefined"
      if (rawId !== null && rawId !== undefined) {
        const cleaned = String(rawId).replace(/[^0-9]/g, '');
        finalId = cleaned ? Number(cleaned) : null;
      }

      setFormData({
        name: settings.name || "",
        phone: settings.phone || "",
        tax_id: settings.tax_id || "",
        address: settings.address || "",
        neighborhood: finalId, 
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
    // Bloqueo de seguridad si la cadena geográfica no está completa
    if (!formData.neighborhood) return;

    try {
      await updateInstitution(formData);
      onClose();
    } catch (err) {
      console.error("CRITICAL_SYSTEM_ERROR: Database sync failed.", err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Contenedor Principal con Altura Definida para Scroll */}
      <div className="bg-[var(--palantir-surface)] border border-[var(--palantir-border)] w-full max-w-4xl h-[90vh] shadow-2xl relative flex flex-col overflow-hidden">
        
        {/* Glow Line Superior */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--palantir-active)] to-transparent opacity-50 z-20"></div>

        {/* Header - FIJO */}
        <div className="flex justify-between items-center p-5 border-b border-[var(--palantir-border)] bg-black/40 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <GlobeAltIcon className="w-5 h-5 text-[var(--palantir-active)]" />
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--palantir-text)]">
                Institution_Profile_Editor
              </h2>
              <p className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
                System: MEDOPS // IDENTITY_VAULT
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors cursor-crosshair">
            <XMarkIcon className="w-5 h-5 text-[var(--palantir-muted)]" />
          </button>
        </div>

        {/* Área Escroleable - flex-1 */}
        <div className="flex-1 overflow-y-auto custom-modal-scroll bg-black/5">
          <form 
            onSubmit={handleSubmit} 
            className="p-8 space-y-12"
            id="institution-form"
          >
            
            {/* Sección: Identidad y Logo */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-3 flex flex-col items-center gap-4">
                <div className="relative group w-32 h-32 border border-[var(--palantir-border)] bg-black/40 p-1 shadow-inner overflow-hidden">
                  {preview ? (
                    <img src={preview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--palantir-muted)]">
                      <PhotoIcon className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-crosshair border-2 border-dashed border-[var(--palantir-active)]/50">
                    <span className="text-[9px] font-black uppercase tracking-tighter text-white">Upload_Asset</span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
                <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase italic">Institutional_Seal</span>
              </div>

              <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-mono font-bold text-[var(--palantir-muted)] uppercase tracking-widest block px-1">Center_Name</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black/40 border border-[var(--palantir-border)] p-3 text-[11px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all focus:ring-1 focus:ring-[var(--palantir-active)]/20 uppercase"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-mono font-bold text-[var(--palantir-muted)] uppercase tracking-widest block px-1">Phone_Comm_Line</label>
                  <input 
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-black/40 border border-[var(--palantir-border)] p-3 text-[11px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[9px] font-mono font-bold text-[var(--palantir-muted)] uppercase tracking-widest block px-1">Tax_Registry_ID (RIF/NIT)</label>
                  <input 
                    type="text"
                    value={formData.tax_id}
                    onChange={e => setFormData({...formData, tax_id: e.target.value})}
                    className="w-full bg-black/40 border border-[var(--palantir-border)] p-3 text-[11px] font-mono text-[var(--palantir-active)] focus:border-[var(--palantir-active)] outline-none font-bold tracking-[0.2em] uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Sección: Ubicación Geográfica (Cascada) */}
            <div className="border-t border-[var(--palantir-border)]/10 pt-8">
               <LocationSelector 
                initialNeighborhoodId={formData.neighborhood ?? undefined}
                onLocationChange={(id) => setFormData({...formData, neighborhood: id})}
              />
            </div>

            {/* Sección: Dirección Detallada */}
            <div className="space-y-3 pb-10">
              <label className="text-[9px] font-mono font-bold text-[var(--palantir-muted)] uppercase tracking-widest block px-1">Full_Street_Address_Metadata</label>
              <textarea 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                rows={3}
                className="w-full bg-black/40 border border-[var(--palantir-border)] p-4 text-[11px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none uppercase resize-none"
                placeholder="DETAILS: BUILDING, FLOOR, OFFICE, LANDMARKS..."
              />
            </div>
          </form>
        </div>

        {/* Footer - FIJO */}
        <div className="p-6 border-t border-[var(--palantir-border)]/30 bg-black/60 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${formData.neighborhood ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'}`} />
            <span className="text-[8px] font-mono font-black text-[var(--palantir-muted)] uppercase tracking-widest">
              {formData.neighborhood ? 'System_Ready // Identity_Verified' : 'Incomplete_Geographic_Chain'}
            </span>
          </div>

          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2 text-[10px] font-mono font-bold text-[var(--palantir-muted)] hover:text-white transition-colors uppercase tracking-widest"
            >
              Abort
            </button>
            <button 
              form="institution-form"
              type="submit"
              disabled={isUpdating || !formData.neighborhood}
              className={`
                flex items-center gap-3 px-10 py-3 text-[10px] font-black uppercase tracking-[0.3em] rounded-sm transition-all
                ${formData.neighborhood 
                  ? 'bg-[var(--palantir-active)] text-black hover:bg-white shadow-[0_0_20px_rgba(0,242,255,0.2)]' 
                  : 'bg-white/5 text-[var(--palantir-muted)] cursor-not-allowed'}
              `}
            >
              {isUpdating ? (
                <ArrowPathIcon className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <ShieldCheckIcon className="w-4 h-4" />
                  Synchronize
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
