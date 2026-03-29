// src/pages/Settings/ConfigPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/Common/PageHeader";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { useSpecialtyChoices } from "@/hooks/settings/useSpecialtyChoices";
import EditInstitutionModal from "@/components/Settings/EditInstitutionModal";
import DoctorBankConfig from "@/components/Settings/DoctorBankConfig";
import DoctorWhatsAppConfig from "@/components/Settings/DoctorWhatsAppConfig";
import SpecialtyComboboxElegante from "@/components/Consultation/SpecialtyComboboxElegante";
import { api } from "@/lib/apiClient";
import type { Specialty } from "@/types/config";
import { 
  FingerPrintIcon,
  ShieldCheckIcon,
  EyeIcon,
  BuildingOfficeIcon,
  PencilSquareIcon,
  KeyIcon
} from "@heroicons/react/24/outline";
export default function ConfigPage() {
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
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  const [doctorForm, setDoctorForm] = useState({
    full_name: "",
    gender: "M" as 'M' | 'F' | 'O',
    colegiado_id: "",
    license: "",
    email: "",
    phone: "",
    bio: "",
    signature: null as File | null,
    photo: null as File | null,
    specialties: [] as Specialty[],
  });
  
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [whatsAppConfig, setWhatsAppConfig] = useState({
    whatsapp_enabled: false,
    whatsapp_business_number: '',
    whatsapp_business_id: '',
    whatsapp_access_token: '',
    reminder_hours_before: 24,
  });
  
  const bankData = {
    bank_name: (doc as any)?.bank_name || "",
    bank_rif: (doc as any)?.bank_rif || "",
    bank_phone: (doc as any)?.bank_phone || "",
    bank_account: (doc as any)?.bank_account || "",
  };
  
  // ✅ Inicializar formulario desde doc
  useEffect(() => {
    if (!doc || specialties.length === 0 || initialized) return;
    
    const ids = Array.isArray(doc.specialty_ids) ? doc.specialty_ids.map(Number) : [];
    const matched = specialties.filter((s) => ids.includes(s.id));
    
    setDoctorForm({
      full_name: doc.full_name || "",
      gender: doc.gender || "M",
      colegiado_id: doc.colegiado_id || "",
      license: doc.license || "",
      email: doc.email || "",
      phone: doc.phone || "",
      bio: doc.bio || "",
      signature: null,
      photo: null,
      specialties: matched,
    });
    
    // ✅ CORREGIDO: Manejar signature que puede ser string o File
    if (doc.signature && typeof doc.signature === 'string') {
      const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');
      const sigUrl = doc.signature.startsWith('http') ? doc.signature : `${baseUrl}${doc.signature.startsWith('/') ? '' : '/'}${doc.signature}`;
      setSignaturePreview(sigUrl);
    }
    
    // ✅ CORREGIDO: Manejar photo que puede ser string o File
    const docPhoto = (doc as any).photo;
    if (docPhoto && typeof docPhoto === 'string') {
      const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');
      const photoUrl = docPhoto.startsWith('http') ? docPhoto : `${baseUrl}${docPhoto.startsWith('/') ? '' : '/'}${docPhoto}`;
      setPhotoPreview(photoUrl);
    }
    
    if (doc.whatsapp_enabled !== undefined) {
      setWhatsAppConfig({
        whatsapp_enabled: doc.whatsapp_enabled || false,
        whatsapp_business_number: doc.whatsapp_business_number || '',
        whatsapp_business_id: doc.whatsapp_business_id || '',
        whatsapp_access_token: doc.whatsapp_access_token || '',
        reminder_hours_before: doc.reminder_hours_before || 24,
      });
    }
    
    setInitialized(true);
  }, [doc, specialties, initialized]);
  
  const handleSaveBankData = async (bankData: any) => {
    await updateDoctor(bankData as any);
  };
  
  const handleSaveWhatsApp = async (whatsAppData: any) => {
    await updateDoctor(whatsAppData as any);
  };
  
  const handleSaveDoctor = async () => {
    const formData = new FormData();
    
    formData.append('full_name', doctorForm.full_name);
    formData.append('gender', doctorForm.gender);
    formData.append('colegiado_id', doctorForm.colegiado_id);
    formData.append('license', doctorForm.license);
    formData.append('email', doctorForm.email || '');
    formData.append('phone', doctorForm.phone || '');
    formData.append('bio', doctorForm.bio || '');
    
    doctorForm.specialties.forEach(s => {
      formData.append('specialty_ids', String(s.id));
    });
    
    if (doctorForm.signature instanceof File) {
      formData.append('signature', doctorForm.signature);
    }
    if (doctorForm.photo instanceof File) {
      formData.append('photo', doctorForm.photo);
    }
    
    formData.append('whatsapp_enabled', String(whatsAppConfig.whatsapp_enabled));
    formData.append('whatsapp_business_number', whatsAppConfig.whatsapp_business_number);
    formData.append('whatsapp_business_id', whatsAppConfig.whatsapp_business_id);
    formData.append('whatsapp_access_token', whatsAppConfig.whatsapp_access_token);
    formData.append('reminder_hours_before', String(whatsAppConfig.reminder_hours_before));
    
    await updateDoctor(formData as any);
    setShowDoctorModal(false);
  };
  
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setDoctorForm({ ...doctorForm, signature: file });
      setSignaturePreview(URL.createObjectURL(file));
    }
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setDoctorForm({ ...doctorForm, photo: file });
      setPhotoPreview(URL.createObjectURL(file));
    }
  };
  
  const handleRemoveSignature = () => {
    setDoctorForm({ ...doctorForm, signature: null });
    setSignaturePreview(null);
  };
  
  const handleRemovePhoto = () => {
    setDoctorForm({ ...doctorForm, photo: null });
    setPhotoPreview(null);
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
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => setShowDoctorModal(true)}
                className="p-2 text-white/40 hover:text-emerald-400 transition-colors"
                title="Editar perfil"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-emerald-500/[0.03] border border-emerald-500/20 flex items-center justify-center rounded-sm">
                  <FingerPrintIcon className="w-8 h-8 text-emerald-500/30" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tight">
                    <span className="text-emerald-500/50 mr-2">{doc?.gender === 'F' ? 'Dra.' : 'Dr.'}</span>
                    {doc?.full_name || "SUBJECT_NAME_PENDING"}
                  </h4>
                  <p className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-[0.2em] mt-1 font-bold">
                    PROTOCOL_ID: {doc?.license || "NONE"}
                  </p>
                  {doc?.is_verified && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded text-[8px] text-emerald-400 font-bold tracking-wider border border-emerald-500/20">
                      <ShieldCheckIcon className="w-3 h-3" /> VERIFIED_OPERATOR
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5">
                <button 
                  onClick={() => { if (doc?.id) navigate(`/doctor-profile/${doc.id}`); }}
                  disabled={!doc?.id}
                  className={`w-full flex items-center justify-center gap-3 py-4 border border-emerald-500/10 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06] text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/50 hover:text-emerald-500 transition-all rounded-sm ${!doc?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <EyeIcon className="w-4 h-4" />
                  Visualizar Perfil Público
                </button>
              </div>
              
              <div className="space-y-4 border-y border-white/5 py-6">
                <div className="flex justify-between items-start text-[10px] uppercase">
                  <span className="text-white/30 font-bold tracking-widest font-mono">Deploy_Specialties:</span>
                  <div className="flex flex-wrap gap-2 justify-end max-w-[200px]">
                    {doc?.specialties?.map((s: any) => (
                      <span key={s.id} className="text-[9px] bg-emerald-500/5 text-emerald-500 px-2 py-0.5 border border-emerald-500/10 rounded-full">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <DoctorBankConfig 
                bankName={bankData.bank_name}
                bankRif={bankData.bank_rif}
                bankPhone={bankData.bank_phone}
                bankAccount={bankData.bank_account}
                onUpdate={handleSaveBankData}
              />
              
              <DoctorWhatsAppConfig
                whatsappEnabled={whatsAppConfig.whatsapp_enabled}
                whatsappBusinessNumber={whatsAppConfig.whatsapp_business_number}
                whatsappBusinessId={whatsAppConfig.whatsapp_business_id}
                whatsappAccessToken={whatsAppConfig.whatsapp_access_token}
                reminderHoursBefore={whatsAppConfig.reminder_hours_before}
                onUpdate={handleSaveWhatsApp}
              />
            </div>
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
                      <p className="font-bold text-white">{activeInstitution.name || "UNNAMED_ENTITY"}</p>
                      <p className="text-[9px] text-white/40 mt-1">ID Fiscal: {activeInstitution.tax_id || "N/A"}</p>
                    </div>
                  </div>
                )}
                {institutions.filter(inst => inst.id !== activeInstitution?.id).map((inst) => (
                  <div key={inst.id} className="bg-[#080808] border border-white/10 rounded-sm p-4 group hover:border-white/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white/80">{inst.name || "Institución"}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleSelectInstitution(inst.id)} className="text-[9px] text-emerald-500 hover:underline mr-2">Activar</button>
                        <button onClick={() => handleEditInstitution(inst)} className="p-1 text-white/40 hover:text-blue-400">✏️</button>
                        <button onClick={() => handleDeleteInstitution(inst.id)} className="p-1 text-white/40 hover:text-red-400">🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      
      {/* ✅ CORREGIDO: Modal de edición del doctor CON FORMULARIO COMPLETO */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#0a0a0b] border border-white/10 w-full max-w-lg rounded-sm shadow-2xl my-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-bold">Editar Perfil del Doctor</h3>
              <button onClick={() => setShowDoctorModal(false)} className="text-white/50 hover:text-white">X</button>
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); await handleSaveDoctor(); }} className="p-6 space-y-6">
              
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className={labelStyles}>Title</label>
                  <select 
                    className={inputStyles} 
                    value={doctorForm.gender} 
                    onChange={(e) => setDoctorForm({...doctorForm, gender: e.target.value as any})}
                  >
                    <option value="M">Dr.</option>
                    <option value="F">Dra.</option>
                    <option value="O">Mod.</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className={labelStyles}>Full_System_Name</label>
                  <input className={inputStyles} value={doctorForm.full_name} onChange={(e) => setDoctorForm({...doctorForm, full_name: e.target.value})} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div><label className={labelStyles}>License_UID</label><input className={inputStyles} value={doctorForm.license} onChange={(e) => setDoctorForm({...doctorForm, license: e.target.value})} /></div>
                <div><label className={labelStyles}>Board_ID</label><input className={inputStyles} value={doctorForm.colegiado_id} onChange={(e) => setDoctorForm({...doctorForm, colegiado_id: e.target.value})} /></div>
              </div>
              
              <div className="z-20 relative">
                <label className={labelStyles}>Clinical_Specialties_Array</label>
                <SpecialtyComboboxElegante
                  value={doctorForm.specialties}
                  onChange={(next) => setDoctorForm({ ...doctorForm, specialties: next })}
                  options={specialties}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className={labelStyles}>Public_Biography</label>
                  <textarea 
                    className={inputStyles} 
                    value={doctorForm.bio || ""} 
                    onChange={(e) => setDoctorForm({...doctorForm, bio: e.target.value})}
                    placeholder="Biografía corta para tu perfil público..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className={labelStyles}>Profile_Photo</label>
                  <div className="flex items-center gap-4">
                    {photoPreview && (
                      <div className="relative">
                        <img src={photoPreview} alt="Foto" className="w-16 h-16 rounded-sm object-cover border border-white/10" />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-1 -right-1 bg-red-500/80 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <label className="cursor-pointer flex-1">
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      <div className="w-full bg-black/40 border border-dashed border-white/10 p-4 text-center text-[10px] text-white/40 hover:text-white/60 hover:border-white/20 transition-all rounded-sm">
                        {photoPreview ? 'Cambiar foto' : 'Subir foto de perfil'}
                      </div>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className={labelStyles}>Digital_Signature</label>
                  <div className="flex items-center gap-4">
                    {signaturePreview && (
                      <div className="relative">
                        <img src={signaturePreview} alt="Firma" className="w-32 h-16 object-contain border border-white/10 bg-white/5 rounded-sm" />
                        <button
                          type="button"
                          onClick={handleRemoveSignature}
                          className="absolute -top-1 -right-1 bg-red-500/80 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <label className="cursor-pointer flex-1">
                      <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                      <div className="w-full bg-black/40 border border-dashed border-white/10 p-4 text-center text-[10px] text-white/40 hover:text-white/60 hover:border-white/20 transition-all rounded-sm">
                        {signaturePreview ? 'Cambiar firma' : 'Subir firma digitalizada'}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-emerald-600 text-white text-[10px] font-black px-6 py-4 uppercase tracking-[0.3em] hover:bg-emerald-500 transition-all rounded-sm">
                  <KeyIcon className="w-4 h-4 inline mr-2" /> Guardar Cambios
                </button>
                <button type="button" onClick={() => setShowDoctorModal(false)} className="px-6 text-[10px] font-black uppercase text-white/20 hover:text-white">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <EditInstitutionModal 
        open={isInstModalOpen} 
        onClose={() => setIsInstModalOpen(false)}
        institution={editingInstitution}
      />
    </div>
  );
}