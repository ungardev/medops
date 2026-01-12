import React, { useState, useEffect } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { useInstitutionSettings } from "@/hooks/settings/useInstitutionSettings";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { useSpecialtyChoices } from "@/hooks/settings/useSpecialtyChoices";
import SpecialtyComboboxElegante from "@/components/Consultation/SpecialtyComboboxElegante";
import EditInstitutionModal from "@/components/Settings/EditInstitutionModal";
import type { Specialty } from "@/types/consultation";
import { 
  BuildingOfficeIcon, 
  UserCircleIcon, 
  PencilSquareIcon,
  CloudArrowUpIcon,
  FingerPrintIcon,
  ShieldCheckIcon,
  MapPinIcon
} from "@heroicons/react/24/outline";

type DoctorForm = {
  id?: number;
  full_name: string;
  colegiado_id: string;
  specialties: Specialty[];
  license: string;
  email: string;
  phone: string;
  signature?: string | File | null;
};

export default function ConfigPage() {
  // 🔹 Base URL para activos multimedia
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // 🔹 Hooks de Datos
  const { data: inst, isLoading: instLoading } = useInstitutionSettings();
  const { data: doc, updateDoctor, isLoading: docLoading, handleSignatureChange } = useDoctorConfig();
  const { data: specialties = [] } = useSpecialtyChoices();

  // 🔹 Estados de UI
  const [isInstModalOpen, setIsInstModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(false);
  const [initializedDoctor, setInitializedDoctor] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string>("");

  const [docForm, setDocForm] = useState<DoctorForm>({
    id: undefined, 
    full_name: "", 
    colegiado_id: "", 
    specialties: [], 
    license: "", 
    email: "", 
    phone: "", 
    signature: null,
  });

  // 🔹 Sincronización Profesional (Doctor + Especialidades)
  useEffect(() => {
    if (!doc || specialties.length === 0 || initializedDoctor) return;
    
    const ids = Array.isArray((doc as any).specialty_ids) 
      ? (doc as any).specialty_ids.map((id: number) => Number(id)) 
      : [];
    
    const matched = specialties.filter((s) => ids.includes(s.id));
    
    setDocForm({
      id: doc.id,
      full_name: doc.full_name || "",
      colegiado_id: doc.colegiado_id || "",
      specialties: matched,
      license: doc.license || "",
      email: doc.email || "",
      phone: doc.phone || "",
      signature: doc.signature || null,
    });
    setInitializedDoctor(true);
  }, [doc, specialties, initializedDoctor]);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSignaturePreview(handleSignatureChange(file));
      setDocForm({ ...docForm, signature: file });
    }
  };

  // 🔹 Helper para renderizar el logo sin que se rompa
  const renderLogo = () => {
    if (!inst?.logo) return <CloudArrowUpIcon className="w-6 h-6 text-white/10" />;
    
    const logoUrl = typeof inst.logo === 'string' 
      ? (inst.logo.startsWith('http') ? inst.logo : `${API_BASE}${inst.logo}`)
      : "/logo-placeholder.svg";

    return (
      <img 
        src={logoUrl} 
        className="max-h-full object-contain" 
        alt="Institution Logo"
        onError={(e) => { (e.target as HTMLImageElement).src = "/logo-placeholder.svg"; }}
      />
    );
  };

  const inputStyles = `w-full bg-black/20 border border-white/10 rounded-sm px-4 py-2.5 text-[11px] font-mono text-white focus:outline-none focus:border-[var(--palantir-active)]/50 transition-all`;
  const labelStyles = `text-[9px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)] mb-1.5 block`;

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-[var(--palantir-bg)] min-h-screen">
      
      <style>{`
        .custom-modal-scroll::-webkit-scrollbar { width: 4px; }
        .custom-modal-scroll::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.3); }
        .custom-modal-scroll::-webkit-scrollbar-thumb {
          background: var(--palantir-active);
          border-radius: 10px;
          box-shadow: 0 0 10px var(--palantir-active);
        }
        .custom-modal-scroll {
          scrollbar-width: thin;
          scrollbar-color: var(--palantir-active) rgba(0, 0, 0, 0.3);
        }
      `}</style>

      <PageHeader
        breadcrumb="SYSTEM // PARAMETERS // IDENTITY"
        title="CONFIGURATION_VAULT"
        stats={[
          { label: "AUTH_LEVEL", value: "ADMIN", color: "text-[var(--palantir-active)]" },
          { label: "SYNC_STATUS", value: "ENCRYPTED" }
        ]}
      />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 🏢 INSTITUTIONAL VAULT */}
        <section className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-2 px-1">
            <BuildingOfficeIcon className="w-4 h-4 text-[var(--palantir-active)]" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)]">Institutional_Identity</h3>
          </div>

          <div className="bg-white/[0.02] border border-[var(--palantir-border)] p-6 rounded-sm backdrop-blur-md relative overflow-hidden">
            {instLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-white/5 w-3/4 rounded"></div>
                <div className="h-20 bg-white/5 w-full rounded"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-24 h-24 bg-black/40 border border-[var(--palantir-border)] p-2 flex items-center justify-center overflow-hidden">
                    {renderLogo()}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <span className={labelStyles}>Entity_Name</span>
                      <p className="text-sm font-bold text-white uppercase tracking-tight">{inst?.name || "UNNAMED_ENTITY"}</p>
                    </div>
                    <div>
                      <span className={labelStyles}>Fiscal_Identifier</span>
                      <p className="text-xs font-mono text-[var(--palantir-active)]">{inst?.tax_id || "MISSING_RIF"}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-4 h-4 text-[var(--palantir-muted)] mt-0.5" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter">Region_Hierarchy</span>
                        <div className="text-[10px] font-mono text-white leading-relaxed uppercase">
                          {typeof inst?.neighborhood === 'object' && inst.neighborhood?.parish ? (
                            <>
                              {inst.neighborhood.parish.municipality?.state?.country?.name} <br/>
                              {inst.neighborhood.parish.municipality?.state?.name} <br/>
                              {inst.neighborhood.parish.municipality?.name} / {inst.neighborhood.parish.name}
                            </>
                          ) : "GEOGRAPHIC_CHAIN_NOT_DEFINED"}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter">Local_Address</span>
                        <div className="text-[10px] font-mono text-white uppercase italic">
                          <span className="text-[var(--palantir-active)]">[{typeof inst?.neighborhood === 'object' ? inst.neighborhood?.name : 'N/A'}]</span>
                          <br />
                          {inst?.address || "STREET_DATA_MISSING"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsInstModalOpen(true)} 
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--palantir-active)] hover:text-white transition-colors pt-2"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" /> Modify_Record
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 👨‍⚕️ PROFESSIONAL VAULT */}
        <section className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="flex items-center gap-2 px-1">
            <UserCircleIcon className="w-4 h-4 text-[var(--palantir-active)]" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)]">Practitioner_Profile</h3>
          </div>

          <div className="bg-white/[0.02] border border-[var(--palantir-border)] p-6 rounded-sm backdrop-blur-md relative">
            {!editingDoctor ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--palantir-active)]/20 to-transparent border border-[var(--palantir-active)]/30 flex items-center justify-center">
                    <FingerPrintIcon className="w-8 h-8 text-[var(--palantir-active)] opacity-40" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{docForm.full_name || "NOT_ASSIGNED"}</h4>
                    <p className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase">LICENSE: {docForm.license || "PENDING"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 border-y border-white/5 py-4">
                  <div className="flex justify-between text-[10px] uppercase">
                    <span className="text-[var(--palantir-muted)]">Specialties:</span>
                    <span className="text-white text-right font-bold">{docForm.specialties.map(s => s.name).join(" // ") || "---"}</span>
                  </div>
                  <div className="flex justify-between text-[10px] uppercase">
                    <span className="text-[var(--palantir-muted)]">Board_ID:</span>
                    <span className="text-white font-mono">{docForm.colegiado_id || "---"}</span>
                  </div>
                </div>

                <div>
                  <span className={labelStyles}>Digital_Signature_Active</span>
                  <div className="mt-2 h-16 w-full bg-white/5 border border-white/5 flex items-center px-4 grayscale opacity-50">
                    {docForm.signature ? <span className="text-[9px] font-mono">[ SIGNATURE_BLOB_LOADED ]</span> : <span className="text-[9px] italic">No signature found</span>}
                  </div>
                </div>

                <button onClick={() => setEditingDoctor(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--palantir-active)] hover:text-white transition-colors">
                  <ShieldCheckIcon className="w-3.5 h-3.5" /> Authorization_Required
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                const payload = { ...docForm, specialty_ids: docForm.specialties.map(s => s.id) };
                updateDoctor(payload).then(() => setEditingDoctor(false));
              }} className="space-y-4">
                <div><label className={labelStyles}>Full_Legal_Name</label><input className={inputStyles} value={docForm.full_name} onChange={(e) => setDocForm({...docForm, full_name: e.target.value})} /></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelStyles}>License_Number</label><input className={inputStyles} value={docForm.license} onChange={(e) => setDocForm({...docForm, license: e.target.value})} /></div>
                  <div><label className={labelStyles}>Board_ID</label><input className={inputStyles} value={docForm.colegiado_id} onChange={(e) => setDocForm({...docForm, colegiado_id: e.target.value})} /></div>
                </div>

                <div className="z-20 relative">
                  <label className={labelStyles}>Core_Specialties</label>
                  <SpecialtyComboboxElegante
                    value={docForm.specialties}
                    onChange={(next) => setDocForm({ ...docForm, specialties: next })}
                    options={specialties}
                  />
                </div>

                <div><label className={labelStyles}>Signature_Upload</label><input type="file" onChange={handleSignatureUpload} className="text-[10px] text-[var(--palantir-muted)] file:bg-white/5 file:border-none file:text-white file:px-3 file:py-1" /></div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit" 
                    disabled={docLoading}
                    className="bg-[var(--palantir-active)] text-black text-[10px] font-black px-6 py-2 uppercase tracking-tighter hover:bg-white transition-colors disabled:opacity-50"
                  >
                    {docLoading ? 'SYNCING...' : 'Commit_Changes'}
                  </button>
                  <button type="button" onClick={() => setEditingDoctor(false)} className="text-[10px] font-black uppercase tracking-tighter text-[var(--palantir-muted)]">Abort</button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>

      <EditInstitutionModal 
        open={isInstModalOpen} 
        onClose={() => setIsInstModalOpen(false)} 
      />

      <footer className="mt-12 opacity-10 flex justify-center">
        <div className="text-[8px] font-mono uppercase tracking-[0.5em] text-center">
          SYSTEM_IDENTITY_VERIFIED // SECURE_CONFIG_V2 // ENCRYPTION: AES_256
        </div>
      </footer>
    </div>
  );
}
