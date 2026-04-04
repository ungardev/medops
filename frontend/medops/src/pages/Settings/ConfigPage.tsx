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
  KeyIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import ConfirmGenericModal from "@/components/Common/ConfirmGenericModal";
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
  const [deletingInstitution, setDeletingInstitution] = useState<any>(null);
  
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
    
    if (doc.signature && typeof doc.signature === 'string') {
      const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');
      const sigUrl = doc.signature.startsWith('http') ? doc.signature : `${baseUrl}${doc.signature.startsWith('/') ? '' : '/'}${doc.signature}`;
      setSignaturePreview(sigUrl);
    }
    
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
    await updateDoctor({
      full_name: doctorForm.full_name,
      gender: doctorForm.gender,
      colegiado_id: doctorForm.colegiado_id,
      license: doctorForm.license,
      email: doctorForm.email || '',
      phone: doctorForm.phone || '',
      bio: doctorForm.bio || '',
      specialty_ids: doctorForm.specialties.map(s => s.id),
      signature: doctorForm.signature instanceof File ? doctorForm.signature : undefined,
      photo: doctorForm.photo instanceof File ? doctorForm.photo : undefined,
      whatsapp_enabled: whatsAppConfig.whatsapp_enabled,
      whatsapp_business_number: whatsAppConfig.whatsapp_business_number,
      whatsapp_business_id: whatsAppConfig.whatsapp_business_id,
      whatsapp_access_token: whatsAppConfig.whatsapp_access_token,
      reminder_hours_before: whatsAppConfig.reminder_hours_before,
    } as any);
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
  
  const handleDeleteInstitution = (institution: any) => {
    setDeletingInstitution(institution);
  };
  
  const handleSelectInstitution = async (id: number | undefined) => {
    if (id === undefined) return;
    await setActiveInstitution(id);
  };
  
  const labelStyles = `text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block`;
  const inputStyles = `w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30`;
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "Configuración", active: true }
        ]}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
        
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-[12px] font-medium text-white/70">Perfil del Doctor</h3>
          </div>
          
          <div className="bg-white/5 border border-white/15 p-6 rounded-lg shadow-sm relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => setShowDoctorModal(true)}
                className="p-2 text-white/30 hover:text-emerald-400 transition-colors rounded-lg hover:bg-white/5"
                title="Editar perfil"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center rounded-lg">
                  <FingerPrintIcon className="w-8 h-8 text-emerald-400/40" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-white/90">
                    <span className="text-emerald-400/60 mr-2">{doc?.gender === 'F' ? 'Dra.' : 'Dr.'}</span>
                    {doc?.full_name || "Sin configurar"}
                  </h4>
                  <p className="text-[10px] text-white/30 mt-1">
                    Licencia: {doc?.license || "N/A"}
                  </p>
                  {doc?.is_verified && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md text-[9px] text-emerald-400 font-medium border border-emerald-500/20">
                      <ShieldCheckIcon className="w-3 h-3" /> Verificado
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10">
                <button 
                  onClick={() => { if (doc?.id) navigate(`/doctor-profile/${doc.id}`); }}
                  disabled={!doc?.id}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 border border-emerald-500/15 bg-emerald-500/5 hover:bg-emerald-500/10 text-[11px] font-medium text-emerald-400/70 hover:text-emerald-400 transition-all rounded-lg ${!doc?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <EyeIcon className="w-4 h-4" />
                  Visualizar Perfil Público
                </button>
              </div>
              
              <div className="space-y-4 border-y border-white/10 py-5">
                <div className="flex justify-between items-start text-[10px]">
                  <span className="text-white/30 font-medium">Especialidades:</span>
                  <div className="flex flex-wrap gap-2 justify-end max-w-[200px]">
                    {doc?.specialties?.map((s: any) => (
                      <span key={s.id} className="text-[9px] bg-emerald-500/5 text-emerald-400/70 px-2 py-0.5 border border-emerald-500/15 rounded-full">
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
        
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-medium text-white/70">Instituciones</h3>
            <button
              onClick={handleCreateInstitution}
              className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              + Nueva
            </button>
          </div>
          
          <div className="space-y-3">
            {multiInstLoading ? (
              <div className="h-64 bg-white/5 animate-pulse rounded-lg border border-white/15" />
            ) : institutions.length === 0 ? (
              <div className="p-8 bg-white/5 border border-white/15 rounded-lg text-center">
                <p className="text-white/30 text-[11px]">
                  No hay instituciones configuradas. Haz clic en "+" para crear una.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeInstitution && (
                  <div className="relative group">
                    <div className="absolute -left-1 top-0 bottom-0 w-1 bg-emerald-400 rounded-full" />
                    <div className="bg-white/5 border-2 border-emerald-500/20 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white/90">{activeInstitution.name || "Sin nombre"}</p>
                          <p className="text-[9px] text-white/30 mt-1">RIF: {activeInstitution.tax_id || "N/A"}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditInstitution(activeInstitution)} className="p-1.5 text-white/30 hover:text-emerald-400 rounded-lg hover:bg-white/5" title="Editar">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteInstitution(activeInstitution)} className="p-1.5 text-white/30 hover:text-red-400 rounded-lg hover:bg-red-500/10" title="Eliminar">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {institutions.filter(inst => inst.id !== activeInstitution?.id).map((inst) => (
                  <div key={inst.id} className="bg-white/5 border border-white/15 rounded-lg p-4 group hover:border-white/25 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white/70">{inst.name || "Institución"}</span>
                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleSelectInstitution(inst.id)} className="text-[10px] text-emerald-400 hover:text-emerald-300 mr-2">Activar</button>
                        <button onClick={() => handleEditInstitution(inst)} className="p-1.5 text-white/30 hover:text-emerald-400 rounded-lg hover:bg-white/5" title="Editar">
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteInstitution(inst)} className="p-1.5 text-white/30 hover:text-red-400 rounded-lg hover:bg-red-500/10" title="Eliminar">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1b] border border-white/15 w-full max-w-lg rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-white/5">
              <h3 className="text-[12px] font-semibold text-white">Editar Perfil del Doctor</h3>
              <button onClick={() => setShowDoctorModal(false)} className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">X</button>
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); await handleSaveDoctor(); }} className="p-6 space-y-5">
              
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className={labelStyles}>Título</label>
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
                  <label className={labelStyles}>Nombre Completo</label>
                  <input className={inputStyles} value={doctorForm.full_name} onChange={(e) => setDoctorForm({...doctorForm, full_name: e.target.value})} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyles}>Licencia</label>
                  <input className={inputStyles} value={doctorForm.license} onChange={(e) => setDoctorForm({...doctorForm, license: e.target.value})} />
                </div>
                <div>
                  <label className={labelStyles}>Colegiado ID</label>
                  <input className={inputStyles} value={doctorForm.colegiado_id} onChange={(e) => setDoctorForm({...doctorForm, colegiado_id: e.target.value})} />
                </div>
              </div>
              
              <div className="z-20 relative">
                <label className={labelStyles}>Especialidades Clínicas</label>
                <SpecialtyComboboxElegante
                  value={doctorForm.specialties}
                  onChange={(next) => setDoctorForm({ ...doctorForm, specialties: next })}
                  options={specialties}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={labelStyles}>Biografía Pública</label>
                  <textarea 
                    className={inputStyles} 
                    value={doctorForm.bio || ""} 
                    onChange={(e) => setDoctorForm({...doctorForm, bio: e.target.value})}
                    placeholder="Biografía corta para tu perfil público..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className={labelStyles}>Foto de Perfil</label>
                  <div className="flex items-center gap-4">
                    {photoPreview && (
                      <div className="relative">
                        <img src={photoPreview} alt="Foto" className="w-16 h-16 rounded-lg object-cover border border-white/15" />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-1 -right-1 bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <label className="cursor-pointer flex-1">
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      <div className="w-full bg-white/5 border border-dashed border-white/15 p-4 text-center text-[11px] text-white/30 hover:text-white/50 hover:border-white/25 transition-all rounded-lg">
                        {photoPreview ? 'Cambiar foto' : 'Subir foto de perfil'}
                      </div>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className={labelStyles}>Firma Digital</label>
                  <div className="flex items-center gap-4">
                    {signaturePreview && (
                      <div className="relative">
                        <img src={signaturePreview} alt="Firma" className="w-32 h-16 object-contain border border-white/15 bg-white/5 rounded-lg" />
                        <button
                          type="button"
                          onClick={handleRemoveSignature}
                          className="absolute -top-1 -right-1 bg-red-500/80 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <label className="cursor-pointer flex-1">
                      <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                      <div className="w-full bg-white/5 border border-dashed border-white/15 p-4 text-center text-[11px] text-white/30 hover:text-white/50 hover:border-white/25 transition-all rounded-lg">
                        {signaturePreview ? 'Cambiar firma' : 'Subir firma digitalizada'}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-emerald-500/15 text-emerald-400 text-[11px] font-medium px-6 py-2.5 hover:bg-emerald-500/25 transition-all rounded-lg border border-emerald-500/25">
                  <KeyIcon className="w-4 h-4 inline mr-2" /> Guardar Cambios
                </button>
                <button type="button" onClick={() => setShowDoctorModal(false)} className="px-6 text-[11px] font-medium text-white/40 hover:text-white/70 transition-colors">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <ConfirmGenericModal
        open={!!deletingInstitution}
        title={`Eliminar "${deletingInstitution?.name || ''}"`}
        message="¿Estás seguro de que deseas eliminar esta institución? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={async () => {
          if (deletingInstitution?.id) {
            await deleteInstitution(deletingInstitution.id);
            setDeletingInstitution(null);
          }
        }}
        onCancel={() => setDeletingInstitution(null)}
      />
      
      <EditInstitutionModal 
        open={isInstModalOpen} 
        onClose={() => setIsInstModalOpen(false)}
        institution={editingInstitution}
      />
    </div>
  );
}