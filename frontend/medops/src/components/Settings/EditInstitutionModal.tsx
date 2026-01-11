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

  // Sincronización inicial con Aplanamiento de Jerarquía (Elite Tier)
  useEffect(() => {
    if (open && settings) {
      // Extraemos el ID del objeto neighborhood de forma segura
      // Esto evita pasar objetos completos a los hooks de Location
      const nId = typeof settings.neighborhood === 'object' 
        ? settings.neighborhood?.id 
        : settings.neighborhood;

      setFormData({
        name: settings.name || "",
        phone: settings.phone || "",
        tax_id: settings.tax_id || "",
        address: settings.address || "",
        neighborhood: nId ?? null,
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
    // No permitimos el commit si la ubicación no está verificada
    if (!formData.neighborhood) return;

    try {
      await updateInstitution(formData);
      onClose();
    } catch (err) {
      console.error("Critical Failure: Unable to sync with mainframe.", err);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[var(--palantir-surface)] border border-[var(--palantir-border)] w-full max-w-4xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Decoración de Terminal superior */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--palantir-active)] to-transparent opacity-50"></div>

        {/* Header - FIJO */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--palantir-border)] bg-black/20 shrink-0">
          <div className="flex items-center gap-3">
            <GlobeAltIcon className="w-5 h-5 text-[var(--palantir-active)]" />
            <div>
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--palantir-text)]">
                Institution_Profile_Editor
              </h2>
              <p className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
                Source: MEDOPS // CONFIG // IDENTITY_VAULT
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors cursor-crosshair">
            <XMarkIcon className="w-5 h-5 text-[var(--palantir-muted)]" />
          </button>
        </div>

        {/* Cuerpo del Formulario con Máscara de Desvanecimiento y Scroll Custom */}
        <div className="relative flex-1 overflow-hidden">
          <form 
            onSubmit={handleSubmit} 
            className="p-8 space-y-10 overflow-y-auto h-full custom-modal-scroll"
            id="institution-form"
          >
            
            {/* Fila 1: Logo e Identidad Básica */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-3 flex flex-col items-center gap-4">
                <div className="relative group w-32 h-32 border border-[var(--palantir-border)] bg-black/40 p-1 shadow-inner overflow-hidden">
                  {preview ? (
                    <img src={preview} alt="Logo Preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[var(--palantir-muted)]">
                      <PhotoIcon className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                  <label className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-crosshair border-2 border-dashed border-[var(--palantir-active)]/50">
                    <span className="text-[9px] font-black uppercase tracking-tighter text-white">Replace_Asset</span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
                <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter italic">Institutional_Seal_v1.0</span>
              </div>

              <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-mono font-bold text-[var(--palantir-muted)] uppercase tracking-widest block">Center_Name</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black/40 border border-[var(--palantir-border)] p-3 text-[11px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all focus:ring-1 focus:ring-[var(--palantir-active)]/20"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-mono font-bold text-[var(--palantir-muted)] uppercase tracking-widest block">Phone_Comm_Line</label>
                  <input 
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-black/40 border border-[var(--palantir-border)] p-3 text-[11px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all focus:ring-1 focus:ring-[var(--palantir-active)]/20"
                  />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-[9px] font-mono font-bold text-[var(--palantir-muted)] uppercase tracking-widest block">Tax_Registry_ID (RIF / NIT)</label>
                  <input 
                    type="text"
                    value={formData.tax_id}
                    onChange={e => setFormData({...formData, tax_id: e.target.value})}
                    className="w-full bg-black/40 border border-[var(--palantir-border)] p-3 text-[11px] font-mono text-[var(--palantir-active)] focus:border-[var(--palantir-active)] outline-none transition-all font-bold tracking-[0.2em] uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Fila 2: Selector de Ubicación Jerárquica (Lógica de Cascada) */}
            <div className="border-t border-[var(--palantir-border)]/10 pt-8">
               <LocationSelector 
                initialNeighborhoodId={formData.neighborhood ?? undefined}
                onLocationChange={(id) => setFormData({...formData, neighborhood: id})}
              />
            </div>

            {/* Fila 3: Dirección Detallada */}
            <div className="space-y-3 pb-6">
              <label className="text-[9px] font-mono font-bold text-[var(--palantir-muted)] uppercase tracking-widest block">Full_Street_Address_Metadata</label>
              <textarea 
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
                rows={3}
                className="w-full bg-black/40 border border-[var(--palantir-border)] p-4 text-[11px] font-mono text-[var(--palantir-text)] focus:border-[var(--palantir-active)] outline-none transition-all uppercase placeholder:opacity-10 resize-none"
                placeholder="EDIFICIO, PISO, LOCAL, PUNTO DE REFERENCIA..."
              />
            </div>
          </form>
        </div>

        {/* Footer - FIJO con Status Indicators */}
        <div className="p-6 border-t border-[var(--palantir-border)]/30 bg-black/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${formData.neighborhood ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-amber-500'}`} />
            <span className="text-[8px] font-mono font-black text-[var(--palantir-muted)] uppercase tracking-widest">
              {formData.neighborhood ? 'System_Ready // Identity_Verified' : 'Error: Geographic_Link_Pending'}
            </span>
          </div>

          <div className="flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2 text-[10px] font-mono font-bold text-[var(--palantir-muted)] hover:text-white transition-colors uppercase tracking-widest cursor-crosshair"
            >
              Abort_Changes
            </button>
            <button 
              form="institution-form"
              type="submit"
              disabled={isUpdating || !formData.neighborhood}
              className={`
                flex items-center gap-3 px-10 py-3 text-[10px] font-black uppercase tracking-[0.3em] rounded-sm transition-all cursor-crosshair
                ${formData.neighborhood 
                  ? 'bg-[var(--palantir-active)] text-black hover:bg-white shadow-[0_0_20px_rgba(0,242,255,0.2)]' 
                  : 'bg-white/5 text-[var(--palantir-muted)] cursor-not-allowed opacity-50'}
              `}
            >
              {isUpdating ? (
                <ArrowPathIcon className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <ShieldCheckIcon className="w-4 h-4" />
                  Synchronize_Database
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
