// src/pages/Settings/ConfigPage.tsx
import React, { useState, useEffect, useMemo, memo } from "react";
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
  FingerPrintIcon,
  ShieldCheckIcon,
  MapPinIcon,
  KeyIcon,
  BanknotesIcon,
  CpuChipIcon,
  CommandLineIcon
} from "@heroicons/react/24/outline";

// 🔹 COMPONENTE DE LOGO ESTABLE
const StableLogo = memo(({ url }: { url: string | null }) => {
  const [imgSrc, setImgSrc] = useState<string>(url || "/logo-placeholder.svg");

  useEffect(() => {
    const targetUrl = url || "/logo-placeholder.svg";
    if (targetUrl !== imgSrc) setImgSrc(targetUrl);
  }, [url]);

  return (
    <img 
      src={imgSrc} 
      className="max-h-full object-contain filter grayscale brightness-125 contrast-125 hover:grayscale-0 transition-all duration-700" 
      alt="Core_Identity_Logo"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (target.src !== window.location.origin + "/logo-placeholder.svg") {
          target.src = "/logo-placeholder.svg";
        }
      }}
    />
  );
});

type DoctorForm = {
  id?: number;
  full_name: string;
  gender: 'M' | 'F' | 'O';
  colegiado_id: string;
  specialties: Specialty[];
  license: string;
  email: string;
  phone: string;
  signature?: string | File | null;
};

export default function ConfigPage() {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const { data: inst, isLoading: instLoading } = useInstitutionSettings();
  const { data: doc, updateDoctor, isLoading: docLoading } = useDoctorConfig();
  const { data: specialties = [] } = useSpecialtyChoices();

  const [isInstModalOpen, setIsInstModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Corregido: El estado acepta string, null o File para previsualizaciones/uploads
  const [signaturePreview, setSignaturePreview] = useState<string | File | null>(null);

  const [docForm, setDocForm] = useState<DoctorForm>({
    full_name: "", gender: "M", colegiado_id: "", specialties: [], license: "", email: "", phone: "", signature: null,
  });

  useEffect(() => {
    if (!doc || specialties.length === 0 || initialized) return;
    
    const ids = Array.isArray(doc.specialty_ids) ? doc.specialty_ids.map(Number) : [];
    const matched = specialties.filter((s) => ids.includes(s.id));
    
    setDocForm({
      id: doc.id,
      full_name: doc.full_name || "",
      gender: doc.gender || "M",
      colegiado_id: doc.colegiado_id || "",
      specialties: matched,
      license: doc.license || "",
      email: doc.email || "",
      phone: doc.phone || "",
      signature: doc.signature || null,
    });
    
    if (doc.signature) setSignaturePreview(doc.signature);
    setInitialized(true);
  }, [doc, specialties, initialized]);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const preview = URL.createObjectURL(file);
      setSignaturePreview(preview); // Ahora es compatible
      setDocForm({ ...docForm, signature: file });
    }
  };

  // 🔹 Lógica de Logo con Type Safety
  const memoizedLogoUrl = useMemo(() => {
    if (!inst?.logo) return null;
    
    // Si el logo es un objeto File (recién subido pero no guardado)
    if (inst.logo instanceof File) {
      return URL.createObjectURL(inst.logo);
    }

    // Si es un string (URL del backend)
    const logoStr = String(inst.logo);
    if (logoStr.startsWith('http') || logoStr.startsWith('blob:')) {
      return logoStr;
    }
    
    return `${API_BASE}${logoStr.startsWith('/') ? '' : '/'}${logoStr}`;
  }, [inst?.logo, API_BASE]);

  // 🔹 Type Guard para Geodata (Evita error de 'number')
  const renderAddressInfo = () => {
    if (!inst?.neighborhood || typeof inst.neighborhood === 'number') {
      return <span className="text-red-500/50 italic font-bold">GEODATA_NOT_SYNCED</span>;
    }

    const n = inst.neighborhood as any; // Casting temporal para acceder a campos expandidos
    const parish = n.parish;
    
    if (!parish) return <span className="text-red-500/50 italic font-bold">PARISH_DATA_MISSING</span>;

    return (
      <div className="space-y-1">
        <p className="opacity-40">{parish.municipality?.state?.country?.name || "CORE_LOC_UNKNOWN"}</p>
        <p className="opacity-60">{parish.municipality?.state?.name}</p>
        <p className="font-bold text-emerald-500/80">
          {parish.municipality?.name} / {parish.name}
        </p>
      </div>
    );
  };

  const inputStyles = `w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-[11px] font-mono text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/10`;
  const labelStyles = `text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-2 block`;

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-8 space-y-10 bg-black min-h-screen">
      
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "CONFIGURATION", active: true }
        ]}
        stats={[
          { label: "CORE_STATUS", value: inst?.is_active ? "OPERATIONAL" : "OFFLINE", color: inst?.is_active ? "text-emerald-500" : "text-red-500" },
          { label: "AUDIT_ENGINE", value: "SHA-256_ACTIVE", color: "text-blue-400" }
        ]}
        actions={
          <div className="flex h-10 w-10 items-center justify-center bg-white/5 border border-white/10 rounded-sm group cursor-help">
            <CommandLineIcon className="w-4 h-4 text-white/40 group-hover:text-emerald-500 transition-colors" />
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* 🏢 INSTITUTIONAL VAULT */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1 border-l-2 border-white/10 ml-1">
            <div className="flex items-center gap-3">
                <BuildingOfficeIcon className="w-4 h-4 text-white/20" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Organization_Identity</h3>
            </div>
          </div>

          <div className="bg-[#080808] border border-white/10 p-8 rounded-sm backdrop-blur-xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <CpuChipIcon className="w-24 h-24 text-white" />
            </div>

            {instLoading ? (
              <div className="animate-pulse space-y-6">
                <div className="h-24 bg-white/5 w-24 rounded-sm" />
                <div className="h-12 bg-white/5 w-full rounded-sm" />
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                  <div className="w-32 h-32 bg-black border border-white/10 p-4 flex items-center justify-center shadow-inner relative group">
                    <StableLogo url={memoizedLogoUrl} />
                  </div>
                  <div className="flex-1 space-y-5 text-center md:text-left">
                    <div>
                      <span className={labelStyles}>Legal_Entity_Name</span>
                      <p className="text-xl font-black text-white uppercase tracking-tighter">{inst?.name || "UNNAMED_ENTITY"}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                        <div>
                            <span className={labelStyles}>Fiscal_UID</span>
                            <p className="text-[10px] font-mono text-white/60 bg-white/5 px-3 py-1 border border-white/5">
                                {inst?.tax_id || "NOT_DEFINED"}
                            </p>
                        </div>
                        {inst?.active_gateway !== 'none' && (
                            <div>
                                <span className={labelStyles}>Fintech_Engine</span>
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-sm">
                                    <BanknotesIcon className="w-3 h-3 text-blue-400" />
                                    <span className="text-[10px] font-mono text-blue-400 uppercase">{inst?.active_gateway}</span>
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-8">
                  <div className="space-y-2">
                    <span className="flex items-center gap-2 text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">
                      <MapPinIcon className="w-3 h-3" /> Node_Hierarchy
                    </span>
                    <div className="text-[10px] font-mono text-white/80 leading-relaxed uppercase bg-black/20 p-4 border border-white/5 rounded-sm min-h-[80px]">
                      {renderAddressInfo()}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="flex items-center gap-2 text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">
                      <FingerPrintIcon className="w-3 h-3" /> Address_Vector
                    </span>
                    <div className="text-[10px] font-mono text-white/80 leading-relaxed uppercase bg-black/20 p-4 border border-white/5 rounded-sm min-h-[80px]">
                      <p className="text-white font-bold opacity-70">
                        [{typeof inst?.neighborhood === 'object' ? inst.neighborhood?.name : 'N/A'}]
                      </p>
                      <p className="mt-2 italic text-white/40">{inst?.address || "STREET_DATA_MISSING"}</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsInstModalOpen(true)} 
                  className="w-full flex items-center justify-center gap-3 py-4 border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-white transition-all rounded-sm"
                >
                  <PencilSquareIcon className="w-4 h-4" /> Open_Identity_Editor
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 👨‍⚕️ PROFESSIONAL VAULT */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1 border-l-2 border-emerald-500/50 ml-1">
            <UserCircleIcon className="w-4 h-4 text-emerald-500/50" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Practitioner_Service_Record</h3>
          </div>

          <div className="bg-[#080808] border border-white/10 p-8 rounded-sm backdrop-blur-xl relative shadow-2xl">
            {!editingDoctor ? (
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-emerald-500/[0.03] border border-emerald-500/20 flex items-center justify-center rounded-sm">
                    <FingerPrintIcon className="w-8 h-8 text-emerald-500/30" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tighter">
                        <span className="text-emerald-500/50 mr-2">{doc?.gender === 'F' ? 'Dra.' : 'Dr.'}</span>
                        {docForm.full_name || "SUBJECT_NAME_PENDING"}
                    </h4>
                    <p className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-[0.2em] mt-1 font-bold">PROTOCOL_ID: {docForm.license || "NONE"}</p>
                    {doc?.is_verified && (
                        <div className="mt-2 inline-flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded text-[8px] text-emerald-400 font-bold tracking-wider border border-emerald-500/20">
                            <ShieldCheckIcon className="w-3 h-3" /> VERIFIED_OPERATOR
                        </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 border-y border-white/5 py-6">
                  <div className="flex justify-between items-start text-[10px] uppercase">
                    <span className="text-white/30 font-bold tracking-widest font-mono">Deploy_Specialties:</span>
                    <div className="flex flex-wrap gap-2 justify-end max-w-[200px]">
                        {docForm.specialties.map(s => (
                            <span key={s.id} className="text-[9px] bg-emerald-500/5 text-emerald-500 px-2 py-0.5 border border-emerald-500/10 rounded-full">
                                {s.name}
                            </span>
                        )) || "---"}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] uppercase">
                    <span className="text-white/30 font-bold tracking-widest font-mono">Medical_Board_UID:</span>
                    <span className="text-emerald-500/60 font-mono font-bold">{docForm.colegiado_id || "UNVERIFIED"}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className={labelStyles}>Digital_Validation_Signature</span>
                  <div className="h-24 w-full bg-black/40 border border-white/5 flex items-center justify-center border-dashed relative overflow-hidden group">
                    {signaturePreview ? (
                      <img 
                        src={typeof signaturePreview === 'string' && signaturePreview.startsWith('blob:') 
                          ? signaturePreview 
                          : `${API_BASE}${signaturePreview}`
                        } 
                        alt="Signature" 
                        className="h-full object-contain invert opacity-60 group-hover:opacity-100 transition-opacity p-2" 
                      />
                    ) : (
                      <span className="text-[9px] italic text-white/20">NULL_POINTER: NO_SIGNATURE_DATA</span>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setEditingDoctor(true)} 
                  className="w-full flex items-center justify-center gap-3 py-4 border border-emerald-500/10 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06] text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/50 hover:text-emerald-500 transition-all rounded-sm shadow-lg shadow-emerald-500/5"
                >
                  <KeyIcon className="w-4 h-4" /> Request_Access_Override
                </button>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                const payload = { ...docForm, specialty_ids: docForm.specialties.map(s => s.id) };
                await updateDoctor(payload);
                setEditingDoctor(false);
              }} className="space-y-6">
                
                <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                        <label className={labelStyles}>Title</label>
                        <select 
                            className={inputStyles} 
                            value={docForm.gender} 
                            onChange={(e) => setDocForm({...docForm, gender: e.target.value as any})}
                        >
                            <option value="M">Dr.</option>
                            <option value="F">Dra.</option>
                            <option value="O">Mod.</option>
                        </select>
                    </div>
                    <div className="col-span-3">
                        <label className={labelStyles}>Full_System_Name</label>
                        <input className={inputStyles} value={docForm.full_name} onChange={(e) => setDocForm({...docForm, full_name: e.target.value})} />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div><label className={labelStyles}>License_UID</label><input className={inputStyles} value={docForm.license} onChange={(e) => setDocForm({...docForm, license: e.target.value})} /></div>
                  <div><label className={labelStyles}>Board_ID</label><input className={inputStyles} value={docForm.colegiado_id} onChange={(e) => setDocForm({...docForm, colegiado_id: e.target.value})} /></div>
                </div>

                <div className="z-20 relative">
                  <label className={labelStyles}>Clinical_Specialties_Array</label>
                  <SpecialtyComboboxElegante
                    value={docForm.specialties}
                    onChange={(next) => setDocForm({ ...docForm, specialties: next })}
                    options={specialties}
                  />
                </div>

                <div className="bg-black/40 p-6 border border-white/5 rounded-sm">
                  <label className={labelStyles}>Signature_Blob_Import</label>
                  <input type="file" onChange={handleSignatureUpload} className="w-full text-[10px] text-white/20 file:bg-white/10 file:border-none file:text-white/60 file:px-4 file:py-2 file:text-[9px] file:font-black file:uppercase file:rounded-sm file:mr-4 file:hover:bg-white file:hover:text-black transition-all" />
                  <p className="text-[8px] text-white/10 mt-3 font-mono">SUPPORTED_FORMATS: PNG_TRANSPARENT // MAX_SIZE: 2MB</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit" 
                    disabled={docLoading}
                    className="flex-1 bg-white text-black text-[10px] font-black px-6 py-4 uppercase tracking-[0.3em] hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 rounded-sm"
                  >
                    {docLoading ? 'DATA_SYNC...' : 'Push_To_Mainframe'}
                  </button>
                  <button type="button" onClick={() => setEditingDoctor(false)} className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors">Abort</button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>

      {/* 🔐 SYSTEM INTEGRITY FOOTER */}
      <footer className="mt-16 py-10 border-t border-white/5 flex flex-col items-center gap-6">
        <div className="flex items-center gap-8 opacity-20">
            <div className="h-px w-24 bg-gradient-to-l from-white to-transparent" />
            <div className="text-[9px] font-mono uppercase tracking-[0.8em] text-white">SYSTEM_CORE_V2.4</div>
            <div className="h-px w-24 bg-gradient-to-r from-white to-transparent" />
        </div>
        <div className="flex flex-col items-center gap-2">
            <div className="text-[7px] font-mono text-white/10 uppercase tracking-[0.4em]">AES_256_ENCRYPTED_CONNECTION</div>
            <div className="text-[6px] font-mono text-emerald-500/20 break-all max-w-md text-center uppercase">
                Node_Hash: {hashlib_mock(inst?.name || 'ROOT')}
            </div>
        </div>
      </footer>

      <EditInstitutionModal open={isInstModalOpen} onClose={() => setIsInstModalOpen(false)} />
    </div>
  );
}

function hashlib_mock(str: string) {
    return Array.from(str).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0).toString(16).toUpperCase().padEnd(32, '0');
}
