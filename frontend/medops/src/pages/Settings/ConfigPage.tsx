// src/pages/Settings/ConfigPage.tsx
import React, { useState, useEffect } from "react";
import PageHeader from "@/components/Common/PageHeader";
import { useInstitutionSettings } from "@/hooks/settings/useInstitutionSettings";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { InstitutionSettings, DoctorConfig } from "@/types/config";
import { useSpecialtyChoices } from "@/hooks/settings/useSpecialtyChoices";
import SpecialtyComboboxElegante from "@/components/Consultation/SpecialtyComboboxElegante";
import type { Specialty } from "@/types/consultation";
import { 
  BuildingOfficeIcon, 
  UserCircleIcon, 
  PencilSquareIcon,
  CloudArrowUpIcon,
  FingerPrintIcon,
  ShieldCheckIcon
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
  const { data: inst, updateInstitution, isLoading: instLoading, handleLogoChange } = useInstitutionSettings();
  const { data: doc, updateDoctor, isLoading: docLoading, handleSignatureChange } = useDoctorConfig();
  const { data: specialties = [] } = useSpecialtyChoices();

  const [instForm, setInstForm] = useState<Partial<InstitutionSettings>>(inst || {});
  const [docForm, setDocForm] = useState<DoctorForm>({
    id: undefined, full_name: "", colegiado_id: "", specialties: [], license: "", email: "", phone: "", signature: null,
  });

  const [editingInstitution, setEditingInstitution] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(false);
  const [initializedDoctor, setInitializedDoctor] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [signaturePreview, setSignaturePreview] = useState<string>("");

  useEffect(() => { if (inst) setInstForm(inst); }, [inst]);

  useEffect(() => {
    if (!doc || specialties.length === 0 || initializedDoctor) return;
    const ids = Array.isArray((doc as any).specialty_ids) ? (doc as any).specialty_ids.map((id: number) => Number(id)) : [];
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

  const handleLogoChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setLogoPreview(handleLogoChange(file));
      setInstForm({ ...instForm, logo: file });
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSignaturePreview(handleSignatureChange(file));
      setDocForm({ ...docForm, signature: file });
    }
  };

  const inputStyles = `w-full bg-black/20 border border-white/10 rounded-sm px-4 py-2.5 text-[11px] font-mono text-white focus:outline-none focus:border-[var(--palantir-active)]/50 transition-all`;
  const labelStyles = `text-[9px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)] mb-1.5 block`;

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-[var(--palantir-bg)] min-h-screen">
      <PageHeader
        breadcrumb="SYSTEM // PARAMETERS // IDENTITY"
        title="CONFIGURATION_VAULT"
        stats={[
          { label: "AUTH_LEVEL", value: "ADMIN", color: "text-[var(--palantir-active)]" },
          { label: "SYNC_STATUS", value: "ENCRYPTED" }
        ]}
      />

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 🏢 INSTITUTIONAL VAULT */}
        <section className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center gap-2 px-1">
            <BuildingOfficeIcon className="w-4 h-4 text-[var(--palantir-active)]" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)]">Institutional_Identity</h3>
          </div>

          <div className="bg-white/[0.02] border border-[var(--palantir-border)] p-6 rounded-sm backdrop-blur-md relative overflow-hidden group">
            {instLoading ? (
              <div className="animate-pulse flex space-y-4 flex-col">
                <div className="h-4 bg-white/5 w-3/4 rounded"></div>
                <div className="h-20 bg-white/5 w-full rounded"></div>
              </div>
            ) : !editingInstitution ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="opacity-80">
                    <span className={labelStyles}>Entity_Name</span>
                    <p className="text-sm font-semibold text-white">{instForm.name || "---"}</p>
                  </div>
                  <div>
                    <span className={labelStyles}>Fiscal_Identifier</span>
                    <p className="text-xs font-mono text-[var(--palantir-muted)]">{instForm.tax_id || "NOT_SET"}</p>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4">
                  <span className={labelStyles}>Institutional_Logo</span>
                  <div className="mt-2 h-24 w-40 bg-black/40 border border-dashed border-white/10 flex items-center justify-center overflow-hidden">
                    {instForm.logo ? (
                      <img src="/logo-medops-light.svg" className="h-16 object-contain" alt="Logo" />
                    ) : (
                      <CloudArrowUpIcon className="w-6 h-6 text-white/10" />
                    )}
                  </div>
                </div>

                <button onClick={() => setEditingInstitution(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--palantir-active)] hover:text-white transition-colors">
                  <PencilSquareIcon className="w-3.5 h-3.5" /> Modify_Record
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); updateInstitution(instForm).then(() => setEditingInstitution(false)); }} className="space-y-4">
                <div><label className={labelStyles}>Entity_Name</label><input className={inputStyles} value={instForm.name || ""} onChange={(e) => setInstForm({...instForm, name: e.target.value})} /></div>
                <div><label className={labelStyles}>Address_Primary</label><input className={inputStyles} value={instForm.address || ""} onChange={(e) => setInstForm({...instForm, address: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelStyles}>Contact_Phone</label><input className={inputStyles} value={instForm.phone || ""} onChange={(e) => setInstForm({...instForm, phone: e.target.value})} /></div>
                  <div><label className={labelStyles}>Tax_ID</label><input className={inputStyles} value={instForm.tax_id || ""} onChange={(e) => setInstForm({...instForm, tax_id: e.target.value})} /></div>
                </div>
                <div>
                  <label className={labelStyles}>Upload_New_Logo</label>
                  <input type="file" onChange={handleLogoChangeInput} className="text-[10px] text-[var(--palantir-muted)] file:bg-white/5 file:border-none file:text-white file:px-3 file:py-1 file:mr-4 file:rounded-sm" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="bg-[var(--palantir-active)] text-black text-[10px] font-black px-6 py-2 uppercase tracking-tighter hover:bg-white transition-colors">Update_Identity</button>
                  <button type="button" onClick={() => setEditingInstitution(false)} className="text-[10px] font-black uppercase tracking-tighter text-[var(--palantir-muted)]">Cancel</button>
                </div>
              </form>
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
                    <p className="text-[10px] font-mono text-[var(--palantir-muted)]">LICENSE: {docForm.license || "PENDING"}</p>
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
                  <button type="submit" className="bg-[var(--palantir-active)] text-black text-[10px] font-black px-6 py-2 uppercase tracking-tighter">Commit_Changes</button>
                  <button type="button" onClick={() => setEditingDoctor(false)} className="text-[10px] font-black uppercase tracking-tighter text-[var(--palantir-muted)]">Abort</button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>

      <footer className="mt-12 opacity-10 flex justify-center">
        <div className="text-[8px] font-mono uppercase tracking-[0.5em] text-center">
          SYSTEM_IDENTITY_VERIFIED // SECURE_CONFIG_V2 // ENCRYPTION: AES_256
        </div>
      </footer>
    </div>
  );
}
