// src/pages/Settings/ConfigPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/Common/PageHeader";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { useSpecialtyChoices } from "@/hooks/settings/useSpecialtyChoices";
import EditInstitutionModal from "@/components/Settings/EditInstitutionModal";
import SpecialtyComboboxElegante from "@/components/Consultation/SpecialtyComboboxElegante";
import { api } from "@/lib/apiClient";
import type { Specialty } from "@/types/config";
import { 
  FingerPrintIcon,
  ShieldCheckIcon,
  KeyIcon,
  CommandLineIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";
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
  bio?: string;
  photo_url?: string;
  bank_name?: string;
  bank_rif?: string;
  bank_phone?: string;
  bank_account?: string;
};
type WhatsAppForm = {
  whatsappEnabled: boolean;
  whatsappBusinessNumber: string;
  whatsappBusinessId: string;
  whatsappAccessToken: string;
  reminderHoursBefore: number;
};
export default function ConfigPage() {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const navigate = useNavigate();
  
  const {
    institutions,
    activeInstitution,
    createInstitution,
    deleteInstitution,
    setActiveInstitution,
    isLoading: multiInstLoading,
  } = useInstitutions();
  
  const { data: doc, updateDoctor, isLoading: docLoading } = useDoctorConfig();
  const { data: specialties = [] } = useSpecialtyChoices();
  
  const [isInstModalOpen, setIsInstModalOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<any>(null);
  const [editingDoctor, setEditingDoctor] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | File | null>(null);
  
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  
  const [docForm, setDocForm] = useState<DoctorForm>({
    full_name: "", gender: "M", colegiado_id: "", specialties: [], license: "", email: "", phone: "", signature: null,
    bio: "",
    photo_url: "",
    bank_name: "",
    bank_rif: "",
    bank_phone: "",
    bank_account: "",
  });
  
  const [whatsAppForm, setWhatsAppForm] = useState<WhatsAppForm>({
    whatsappEnabled: false,
    whatsappBusinessNumber: '',
    whatsappBusinessId: '',
    whatsappAccessToken: '',
    reminderHoursBefore: 24,
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
      bio: doc.bio || "",
      photo_url: doc.photo_url || "",
      bank_name: (doc as any).bank_name || "",
      bank_rif: (doc as any).bank_rif || "",
      bank_phone: (doc as any).bank_phone || "",
      bank_account: (doc as any).bank_account || "",
    });
    
    if (doc.whatsapp_enabled !== undefined) {
      setWhatsAppForm({
        whatsappEnabled: doc.whatsapp_enabled || false,
        whatsappBusinessNumber: doc.whatsapp_business_number || '',
        whatsappBusinessId: doc.whatsapp_business_id || '',
        whatsappAccessToken: doc.whatsapp_access_token || '',
        reminderHoursBefore: doc.reminder_hours_before || 24,
      });
    }
    
    if (doc.signature) setSignaturePreview(doc.signature);
    setInitialized(true);
  }, [doc, specialties, initialized]);
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setSignaturePreview(URL.createObjectURL(file));
      setDocForm({ ...docForm, signature: file });
    }
  };
  const handleCreateInstitution = () => {
    setEditingInstitution(null);
    setIsInstModalOpen(true);
  };
  const handleEditInstitution = (institution: any) => {
    setEditingInstitution(institution);
    setIsInstModalOpen(true);
  };
  const handleDeleteInstitution = async (id: number | undefined) => {
    if (id === undefined) return;
    if (confirm("¿Estás seguro de que quieres eliminar esta institución?")) {
      await deleteInstitution(id);
    }
  };
  const handleSelectInstitution = async (id: number | undefined) => {
    if (id === undefined) return;
    await setActiveInstitution(id);
  };
  const updateInstitution = async (formData: any) => {
    const institutionId = editingInstitution?.id || activeInstitution?.id;
    if (!institutionId) return;
    
    const originalHeader = api.defaults.headers.common["X-Institution-ID"];
    api.defaults.headers.common["X-Institution-ID"] = String(institutionId);
    
    try {
      const response = await api.patch("config/institution/", formData);
      return response.data;
    } finally {
      if (originalHeader !== undefined) {
        api.defaults.headers.common["X-Institution-ID"] = originalHeader;
      } else {
        delete api.defaults.headers.common["X-Institution-ID"];
      }
    }
  };
  const handleSaveInstitution = async (formData: any) => {
    if (editingInstitution) {
      await updateInstitution(formData);
    } else {
      await createInstitution(formData);
    }
    setIsInstModalOpen(false);
    setEditingInstitution(null);
  };
  const handleSaveDoctor = async () => {
    const payload = { 
      ...docForm, 
      specialty_ids: docForm.specialties.map(s => s.id),
      ...whatsAppForm
    };
    await updateDoctor(payload);
    setEditingDoctor(false);
  };
  
  const labelStyles = `text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-2 block`;
  const inputStyles = `w-full bg-black/40 border border-white/10 rounded-sm px-4 py-3 text-[11px] font-mono text-white focus:outline-none focus:border-emerald-500/50 transition-all`;
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "CONFIGURATION", active: true }
        ]}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
        
        {/* SECCIÓN 1: PERFIL DEL DOCTOR */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1 border-l-2 border-emerald-500/50 ml-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Perfil del Doctor</h3>
          </div>
          
          <div className="bg-[#080808] border border-white/10 p-8 rounded-sm shadow-2xl relative overflow-hidden">
            {!editingDoctor ? (
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-emerald-500/[0.03] border border-emerald-500/20 flex items-center justify-center rounded-sm">
                    <FingerPrintIcon className="w-8 h-8 text-emerald-500/30" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tight">
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
                
                <div className="pt-4 border-t border-white/5">
                  <button 
                    onClick={() => {
                      if (doc?.id) {
                        navigate(`/doctor-profile/${doc.id}`);
                      } else {
                        alert("No se pudo obtener el ID del doctor. Intente nuevamente.");
                      }
                    }}
                    disabled={!doc?.id}
                    className={`w-full flex items-center justify-center gap-3 py-4 border border-emerald-500/10 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06] text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/50 hover:text-emerald-500 transition-all rounded-sm ${!doc?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <EyeIcon className="w-4 h-4" />
                    Visualizar Perfil Público
                  </button>
                  <p className="text-[8px] text-white/30 text-center mt-2">
                    Vista previa como la verán los pacientes en el portal.
                  </p>
                </div>
                
                <div className="space-y-4 border-y border-white/5 py-6">
                  <div className="flex justify-between items-start text-[10px] uppercase">
                    <span className="text-white/30 font-bold tracking-widest font-mono">Deploy_Specialties:</span>
                    <div className="flex flex-wrap gap-2 justify-end max-w-[200px]">
                        {docForm.specialties.map(s => (
                            <span key={s.id} className="text-[9px] bg-emerald-500/5 text-emerald-500 px-2 py-0.5 border border-emerald-500/10 rounded-full">
                                {s.name}
                            </span>
                        ))}
                    </div>
                  </div>
                </div>
                {/* ✅ NUEVO: Datos bancarios en modo vista */}
                {(docForm.bank_name || docForm.bank_rif || docForm.bank_phone) && (
                  <div className="space-y-3 border-y border-white/5 py-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/30 font-mono">Payment_Config:</p>
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                      {docForm.bank_name && (
                        <div>
                          <span className="text-white/30">Banco:</span>
                          <span className="text-white/80 font-bold ml-2">{docForm.bank_name}</span>
                        </div>
                      )}
                      {docForm.bank_rif && (
                        <div>
                          <span className="text-white/30">Cédula:</span>
                          <span className="text-white/80 font-bold font-mono ml-2">{docForm.bank_rif}</span>
                        </div>
                      )}
                      {docForm.bank_phone && (
                        <div>
                          <span className="text-white/30">Teléfono:</span>
                          <span className="text-white/80 font-bold font-mono ml-2">{docForm.bank_phone}</span>
                        </div>
                      )}
                      {docForm.bank_account && (
                        <div>
                          <span className="text-white/30">Cuenta:</span>
                          <span className="text-white/80 font-bold font-mono ml-2">{docForm.bank_account}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="border border-white/10 rounded-sm overflow-hidden">
                  <button 
                    onClick={() => setIsWhatsAppOpen(!isWhatsAppOpen)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                       <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2325D366'%3E%3Cpath d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'/%3E%3C/svg%3E" className="w-4 h-4" alt="WhatsApp" />
                       <span className="text-[10px] font-black uppercase tracking-wider text-white/60">WhatsApp Business</span>
                    </div>
                    {isWhatsAppOpen ? <ChevronDownIcon className="w-5 h-5 text-white/40" /> : <ChevronRightIcon className="w-5 h-5 text-white/40" />}
                  </button>
                  
                  {isWhatsAppOpen && (
                    <div className="p-4 bg-black/40 border-t border-white/10 space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="whatsappEnabled"
                          checked={whatsAppForm.whatsappEnabled}
                          onChange={(e) => setWhatsAppForm({...whatsAppForm, whatsappEnabled: e.target.checked})}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-green-600"
                        />
                        <label htmlFor="whatsappEnabled" className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
                          Habilitar WhatsApp
                        </label>
                      </div>
                      
                      {whatsAppForm.whatsappEnabled && (
                        <div className="grid grid-cols-2 gap-4 pl-7">
                          <div>
                            <label className={labelStyles}>Business Number</label>
                            <input
                              type="text"
                              value={whatsAppForm.whatsappBusinessNumber}
                              onChange={(e) => setWhatsAppForm({...whatsAppForm, whatsappBusinessNumber: e.target.value})}
                              className={inputStyles}
                            />
                          </div>
                          <div>
                            <label className={labelStyles}>Business ID</label>
                            <input
                              type="text"
                              value={whatsAppForm.whatsappBusinessId}
                              onChange={(e) => setWhatsAppForm({...whatsAppForm, whatsappBusinessId: e.target.value})}
                              className={inputStyles}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className={labelStyles}>Access Token</label>
                            <input
                              type="password"
                              value={whatsAppForm.whatsappAccessToken}
                              onChange={(e) => setWhatsAppForm({...whatsAppForm, whatsappAccessToken: e.target.value})}
                              className={inputStyles}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setEditingDoctor(true)} 
                  className="w-full flex items-center justify-center gap-3 py-4 border border-emerald-500/10 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06] text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/50 hover:text-emerald-500 transition-all rounded-sm"
                >
                  <KeyIcon className="w-4 h-4" /> Editar Perfil
                </button>
              </div>
            ) : (
              <form onSubmit={async (e) => { e.preventDefault(); await handleSaveDoctor(); }} className="space-y-6">
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
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className={labelStyles}>Public_Biography</label>
                      <textarea 
                        className={inputStyles} 
                        value={docForm.bio || ""} 
                        onChange={(e) => setDocForm({...docForm, bio: e.target.value})}
                        placeholder="Biografía corta para tu perfil público..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className={labelStyles}>Profile_Photo_URL</label>
                      <input 
                        type="text"
                        className={inputStyles} 
                        value={docForm.photo_url || ""} 
                        onChange={(e) => setDocForm({...docForm, photo_url: e.target.value})}
                        placeholder="https://ejemplo.com/foto.jpg"
                      />
                    </div>
                  </div>
                  <div className="bg-black/40 p-6 border border-white/5 rounded-sm">
                    <label className={labelStyles}>Signature_Blob_Import</label>
                    <input type="file" onChange={handleSignatureUpload} className="w-full text-[10px] text-white/20 file:bg-white/10 file:border-none file:text-white/60 file:px-4 file:py-2 file:text-[9px] file:font-black file:uppercase file:rounded-sm file:mr-4 file:hover:bg-white file:hover:text-black transition-all" />
                  </div>
                  
                  {/* ✅ NUEVO: Sección de Datos Bancarios */}
                  <div className="pt-6 border-t border-white/10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4 flex items-center gap-2">
                      <BuildingOfficeIcon className="w-4 h-4" />
                      Datos Bancarios (Para recibir pagos)
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelStyles}>Banco</label>
                        <select
                          className={inputStyles}
                          value={docForm.bank_name || ""}
                          onChange={(e) => setDocForm({...docForm, bank_name: e.target.value})}
                        >
                          <option value="">Seleccionar banco</option>
                          <option value="Banco Mercantil">Banco Mercantil</option>
                          <option value="Banesco">Banesco</option>
                          <option value="Banco de Venezuela">Banco de Venezuela</option>
                          <option value="BBVA Provincial">BBVA Provincial</option>
                          <option value="Bancamiga">Bancamiga</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelStyles}>Cédula/RIF</label>
                        <input
                          className={inputStyles}
                          value={docForm.bank_rif || ""}
                          onChange={(e) => setDocForm({...docForm, bank_rif: e.target.value})}
                          placeholder="V-12345678"
                        />
                      </div>
                      <div>
                        <label className={labelStyles}>Teléfono Pago Móvil</label>
                        <input
                          className={inputStyles}
                          value={docForm.bank_phone || ""}
                          onChange={(e) => setDocForm({...docForm, bank_phone: e.target.value})}
                          placeholder="04121234567"
                        />
                      </div>
                      <div>
                        <label className={labelStyles}>Número de Cuenta</label>
                        <input
                          className={inputStyles}
                          value={docForm.bank_account || ""}
                          onChange={(e) => setDocForm({...docForm, bank_account: e.target.value})}
                          placeholder="0105-XXXX-XXXX-XXXX"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* WhatsApp Section */}
                  <div className="pt-6 border-t border-white/10">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-4 flex items-center gap-2">
                      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2325D366'%3E%3Cpath d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'/%3E%3C/svg%3E" className="w-4 h-4" alt="WhatsApp" />
                      WhatsApp Business
                    </h4>
                     
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="whatsappEnabledEdit"
                          checked={whatsAppForm.whatsappEnabled}
                          onChange={(e) => setWhatsAppForm({...whatsAppForm, whatsappEnabled: e.target.checked})}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-green-600"
                        />
                        <label htmlFor="whatsappEnabledEdit" className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                          Habilitar WhatsApp
                        </label>
                      </div>
                       
                      {whatsAppForm.whatsappEnabled && (
                        <div className="grid grid-cols-2 gap-4 pl-7">
                          <div>
                            <label className={labelStyles}>Business Number</label>
                            <input
                              type="text"
                              value={whatsAppForm.whatsappBusinessNumber}
                              onChange={(e) => setWhatsAppForm({...whatsAppForm, whatsappBusinessNumber: e.target.value})}
                              placeholder="+58 412-123-4567"
                              className={inputStyles}
                            />
                          </div>
                          <div>
                            <label className={labelStyles}>Business ID</label>
                            <input
                              type="text"
                              value={whatsAppForm.whatsappBusinessId}
                              onChange={(e) => setWhatsAppForm({...whatsAppForm, whatsappBusinessId: e.target.value})}
                              placeholder="1234567890"
                              className={inputStyles}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className={labelStyles}>Access Token</label>
                            <input
                              type="password"
                              value={whatsAppForm.whatsappAccessToken}
                              onChange={(e) => setWhatsAppForm({...whatsAppForm, whatsappAccessToken: e.target.value})}
                              placeholder="EA..."
                              className={inputStyles}
                            />
                          </div>
                          <div>
                            <label className={labelStyles}>Recordatorio (horas)</label>
                            <select
                              value={whatsAppForm.reminderHoursBefore}
                              onChange={(e) => setWhatsAppForm({...whatsAppForm, reminderHoursBefore: parseInt(e.target.value)})}
                              className={inputStyles}
                            >
                              <option value={12}>12 horas</option>
                              <option value={24}>24 horas</option>
                              <option value={48}>48 horas</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button type="submit" className="flex-1 bg-white text-black text-[10px] font-black px-6 py-4 uppercase tracking-[0.3em] hover:bg-emerald-500 hover:text-white transition-all rounded-sm">
                      Push_To_Mainframe
                    </button>
                    <button type="button" onClick={() => setEditingDoctor(false)} className="px-6 text-[10px] font-black uppercase text-white/20 hover:text-white">Abort</button>
                  </div>
               </form>
            )}
          </div>
        </section>
        
        {/* SECCIÓN 2: INSTITUCIONES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1 border-l-2 border-emerald-500/50 ml-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
              Institutions_Management
            </h3>
            <button
              onClick={handleCreateInstitution}
              className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              + ADD NEW
            </button>
          </div>
          <div className="space-y-4">
            {multiInstLoading ? (
              <div className="h-64 bg-white/5 animate-pulse rounded-sm border border-white/10" />
            ) : institutions.length === 0 ? (
              <div className="p-8 bg-white/5 border border-white/10 rounded-sm text-center">
                <p className="text-white/40 text-[9px] font-mono uppercase tracking-[0.2em]">
                  No institutions configured. Click "+" to create one.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeInstitution && (
                  <div className="relative group">
                    <div className="absolute -left-1 top-0 bottom-0 w-1 bg-emerald-500 rounded-sm" />
                    <div className="bg-[#080808] border-2 border-emerald-500/30 rounded-sm p-4 shadow-2xl">
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <BuildingOfficeIcon className="w-5 h-5 text-emerald-500/50" />
                            <span className="font-bold text-white">{activeInstitution.name || "UNNAMED_ENTITY"}</span>
                            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-medium">ACTIVE</span>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleEditInstitution(activeInstitution)} className="p-1 text-white/40 hover:text-blue-400"><PencilIcon className="w-4 h-4" /></button>
                             <button onClick={() => handleDeleteInstitution(activeInstitution.id)} className="p-1 text-white/40 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                          </div>
                       </div>
                       <p className="text-[9px] text-white/40 ml-7">ID Fiscal: {activeInstitution.tax_id || "N/A"}</p>
                    </div>
                  </div>
                )}
                {institutions.filter(inst => inst.id !== activeInstitution?.id).map((inst) => (
                  <div key={inst.id} className="bg-[#080808] border border-white/10 rounded-sm p-4 group hover:border-white/20 transition-colors">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <BuildingOfficeIcon className="w-5 h-5 text-white/30" />
                           <span className="font-medium text-white/80">{inst.name || "Institución"}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleSelectInstitution(inst.id)} className="text-[9px] text-emerald-500 hover:underline mr-2">Activar</button>
                           <button onClick={() => handleEditInstitution(inst)} className="p-1 text-white/40 hover:text-blue-400"><PencilIcon className="w-4 h-4" /></button>
                           <button onClick={() => handleDeleteInstitution(inst.id)} className="p-1 text-white/40 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      
      <EditInstitutionModal 
        open={isInstModalOpen} 
        onClose={() => setIsInstModalOpen(false)}
        institution={editingInstitution}
      />
    </div>
  );
}