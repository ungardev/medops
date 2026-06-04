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
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon
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
  
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  
  const [doctorForm, setDoctorForm] = useState({
    full_name: "",
    national_id: "",
    birthdate: "",
    birth_country: "Venezuela",
    gender: "M" as 'M' | 'F' | 'O',
    colegiado_id: "",
    license: "",
    license_expiry_date: "",
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

  useEffect(() => {
    if (!doc || specialties.length === 0 || initialized) return;
    
    const ids = Array.isArray(doc.specialty_ids) ? doc.specialty_ids.map(Number) : [];
    const matched = specialties.filter((s) => ids.includes(s.id));
    
    setDoctorForm({
      full_name: doc.full_name || "",
      national_id: doc.national_id || "",
      birthdate: doc.birthdate || "",
      birth_country: doc.birth_country || "Venezuela",
      gender: doc.gender || "M",
      colegiado_id: doc.colegiado_id || "",
      license: doc.license || "",
      license_expiry_date: doc.license_expiry_date || "",
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
      setInitialized(true);
    }
  }, [doc, specialties, initialized]);

  useEffect(() => {
    if (showDoctorModal) {
      setIsLoadingModal(true);
      setInitialized(false);
      if (doc?.signature && typeof doc.signature === 'string') {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');
        const sigUrl = doc.signature.startsWith('http') ? doc.signature : `${baseUrl}${doc.signature.startsWith('/') ? '' : '/'}${doc.signature}`;
        setSignaturePreview(sigUrl);
      } else {
        setSignaturePreview(null);
      }
      const docPhoto = (doc as any)?.photo;
      if (docPhoto && typeof docPhoto === 'string') {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');
        const photoUrl = docPhoto.startsWith('http') ? docPhoto : `${baseUrl}${docPhoto.startsWith('/') ? '' : '/'}${docPhoto}`;
        setPhotoPreview(photoUrl);
      } else {
        setPhotoPreview(null);
      }
      setTimeout(() => setIsLoadingModal(false), 300);
    }
  }, [showDoctorModal, doc]);
  
  const handleSaveBankData = async (bankData: any) => {
    await updateDoctor(bankData as any);
  };
  
  const handleSaveWhatsApp = async (whatsAppData: any) => {
    await updateDoctor(whatsAppData as any);
  };
  
  const handleSaveDoctor = async () => {
    setIsSaving(true);
    try {
      const result = await updateDoctor({
        full_name: doctorForm.full_name,
        national_id: doctorForm.national_id,
        birthdate: doctorForm.birthdate,
        birth_country: doctorForm.birth_country,
        gender: doctorForm.gender,
        colegiado_id: doctorForm.colegiado_id,
        license: doctorForm.license,
        license_expiry_date: doctorForm.license_expiry_date,
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
      const res = result as any;
      if (res?.signature) {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');
        const sigUrl = res.signature.startsWith('http') ? res.signature : `${baseUrl}${res.signature.startsWith('/') ? '' : '/'}${res.signature}`;
        setSignaturePreview(sigUrl);
      }
      if (res?.photo) {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '');
        const photoUrl = res.photo.startsWith('http') ? res.photo : `${baseUrl}${res.photo.startsWith('/') ? '' : '/'}${res.photo}`;
        setPhotoPreview(photoUrl);
      }
    } finally {
      setIsSaving(false);
    }
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
   
  const handleSelectInstitution = async (id: number | undefined) => {
    if (id === undefined) return;
    await setActiveInstitution(id);
  };
  
  const labelStyles = `text-sm font-medium text-white/50 uppercase tracking-wider mb-2 block`;
  const inputStyles = `w-full bg-white/5 border border-white/15 rounded-xl px-5 py-3.5 text-sm text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30`;
  
  return (
    <div className="space-y-6">
      
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/doctor" },
          { label: "Configuración", active: true }
        ]}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
        
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-white/70">Perfil del Doctor</h3>
          </div>
          
          <div className="bg-white/5 border border-white/15 p-6 rounded-xl shadow-sm relative overflow-hidden">
            <div className="absolute top-5 right-5">
              <button 
                onClick={() => setShowDoctorModal(true)}
                className="p-2.5 text-white/30 hover:text-emerald-400 transition-colors rounded-lg hover:bg-white/5"
                title="Actualizar Firma y Foto"
              >
                <PencilSquareIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Banner de verificación pendiente */}
              {!doc?.is_verified && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ShieldCheckIcon className="w-5 h-5 text-amber-400" />
                    <span className="text-sm text-amber-400 font-medium">
                      Verificación MPPS en proceso. El Admin de MEDOPZ está revisando tus credenciales.
                    </span>
                  </div>
                  {doc?.verification_notes && (
                    <p className="text-sm text-white/40 mt-2 ml-8">{doc.verification_notes}</p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center rounded-xl">
                  <FingerPrintIcon className="w-10 h-10 text-emerald-400/40" />
                </div>
                <div>
                  <h4 className="text-xl font-medium text-white/90">
                    <span className="text-emerald-400/60 mr-2">{doc?.gender === 'F' ? 'Dra.' : 'Dr.'}</span>
                    {doc?.full_name || "Sin configurar"}
                  </h4>
                  <p className="text-sm text-white/30 mt-2">
                    Cédula: {doc?.national_id || "N/A"}
                  </p>
                  {/* License Status Badge */}
                  <div className="mt-3 flex items-center gap-3">
                    {doc?.license_expiry_status === 'active' && (
                      <span className="inline-flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-md text-sm text-emerald-400 font-medium border border-emerald-500/20">
                          <CheckCircleIcon className="w-4 h-4" /> Licencia Activa
                        </span>
                    )}
                    {doc?.license_expiry_status === 'expiring_soon' && (
                      <span className="inline-flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-md text-sm text-amber-400 font-medium border border-amber-500/20">
                          <ExclamationTriangleIcon className="w-4 h-4" /> Por Expirar
                        </span>
                    )}
                    {doc?.license_expiry_status === 'expired' && (
                      <span className="inline-flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-md text-sm text-red-400 font-medium border border-red-500/20">
                          <XCircleIcon className="w-4 h-4" /> Licencia Expirada
                        </span>
                    )}
                    {(doc?.license_expiry_status === 'unknown' || !doc?.license_expiry_status) && (
                      <span className="inline-flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-md text-sm text-white/40 font-medium border border-white/10">
                          <QuestionMarkCircleIcon className="w-4 h-4" /> Sin Fecha
                        </span>
                    )}
                    {doc?.is_verified && (
                      <span className="inline-flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-md text-sm text-emerald-400 font-medium border border-emerald-500/20">
                        <ShieldCheckIcon className="w-4 h-4" /> MPPS Verificado
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-5 border-t border-white/10">
                <button 
                  onClick={() => { if (doc?.id) navigate(`/doctor-profile/${doc.id}`); }}
                  disabled={!doc?.id}
                  className={`w-full flex items-center justify-center gap-2 py-3 border border-emerald-500/15 bg-emerald-500/5 hover:bg-emerald-500/10 text-sm font-medium text-emerald-400/70 hover:text-emerald-400 transition-all rounded-lg ${!doc?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <EyeIcon className="w-5 h-5" />
                  Visualizar Perfil Público
                </button>
              </div>
              
              <div className="space-y-5 border-y border-white/10 py-6">
                <div className="flex justify-between items-start text-sm">
                  <span className="text-white/30 font-medium">Especialidades:</span>
                  <div className="flex flex-wrap gap-3 justify-end max-w-[240px]">
                    {doc?.specialties?.map((s: any) => (
                      <span key={s.id} className="text-sm bg-emerald-500/5 text-emerald-400/70 px-3 py-1 border border-emerald-500/15 rounded-full">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <DoctorBankConfig 
                bankName={(doc as any)?.bank_name || ""}
                bankRif={(doc as any)?.bank_rif || ""}
                bankPhone={(doc as any)?.bank_phone || ""}
                bankAccount={(doc as any)?.bank_account || ""}
                binanceCryptoWalletAddress={(doc as any)?.binance_crypto_wallet_address || ""}
                binanceNetwork={(doc as any)?.binance_network || "TRC20"}
                paymentMobileEnabled={(doc as any)?.payment_mobile_enabled ?? true}
                bankTransferEnabled={(doc as any)?.bank_transfer_enabled ?? false}
                cryptoEnabled={(doc as any)?.crypto_enabled ?? false}
                commissionDoctorPercent={(doc as any)?.commission_doctor_percent ?? 3.0}
                onUpdate={handleSaveBankData}
              />
              
              <DoctorWhatsAppConfig
                whatsappEnabled={whatsAppConfig.whatsapp_enabled}
                whatsappBusinessNumber={whatsAppConfig.whatsapp_business_number}
                whatsappBusinessId={whatsAppConfig.whatsapp_business_id}
                whatsappAccessToken={whatsAppConfig.whatsapp_access_token}
                whatsappWebhookVerifyToken={(doc as any)?.whatsapp_webhook_verify_token || ''}
                reminderHoursBefore={whatsAppConfig.reminder_hours_before}
                doctorId={doc?.id}
                onUpdate={handleSaveWhatsApp}
              />
            </div>
          </div>
        </section>
        
        <section className="space-y-5">
          <h3 className="text-sm font-medium text-white/70">Institución Activa</h3>
          
          <div className="space-y-4">
            {multiInstLoading ? (
              <div className="h-28 bg-white/5 animate-pulse rounded-xl border border-white/15" />
            ) : institutions.length === 0 ? (
              <div className="p-10 bg-white/5 border border-white/15 rounded-xl text-center">
                <p className="text-white/30 text-sm">
                  No hay instituciones configuradas. Contacta al administrador de MEDOPZ.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeInstitution && (
                  <div className="relative">
                    <div className="absolute -left-1.5 top-0 bottom-0 w-1.5 bg-emerald-400 rounded-full" />
                    <div className="bg-white/5 border-2 border-emerald-500/20 rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white/90 text-lg">{activeInstitution.name || "Sin nombre"}</p>
                          <p className="text-sm text-white/30 mt-1">RIF: {activeInstitution.tax_id || "N/A"}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-emerald-400/70 px-3 py-1.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">Activa</span>
                          <button
                            onClick={() => setShowInstitutionModal(true)}
                            className="p-2 text-white/40 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-colors"
                            title="Editar institución"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {institutions.filter(inst => inst.id !== activeInstitution?.id).map((inst) => (
                  <div key={inst.id} className="bg-white/5 border border-white/15 rounded-xl p-5 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-white/70 text-lg">{inst.name || "Institución"}</span>
                    </div>
                    <button onClick={() => handleSelectInstitution(inst.id)} className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                      Activar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <div className="bg-[#1a1a1b] border border-white/15 w-full max-w-lg rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/15 bg-white/5">
              <h3 className="text-base font-semibold text-white">Actualizar Firma y Elementos Gráficos</h3>
              <button onClick={() => setShowDoctorModal(false)} className="text-white/40 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">X</button>
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); await handleSaveDoctor(); }} className="p-6 space-y-6">
              
              {isLoadingModal ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-10 h-10 border-2 border-emerald-400/50 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className={labelStyles}>Foto de Perfil</label>
                  <div className="flex items-center gap-5">
                    {photoPreview && (
                      <div className="relative">
                        <img src={photoPreview} alt="Foto" className="w-20 h-20 rounded-xl object-cover border border-white/15" />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-1.5 -right-1.5 bg-red-500/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <label className="cursor-pointer flex-1">
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      <div className="w-full bg-white/5 border border-dashed border-white/15 p-5 text-center text-sm text-white/30 hover:text-white/50 hover:border-white/25 transition-all rounded-xl">
                        {photoPreview ? 'Cambiar foto' : 'Subir foto de perfil'}
                      </div>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className={labelStyles}>Firma Digital</label>
                  <div className="flex items-center gap-5">
                    {signaturePreview && (
                      <div className="relative">
                        <img src={signaturePreview} alt="Firma" className="w-40 h-20 object-contain border border-white/15 bg-white/5 rounded-xl" />
                        <button
                          type="button"
                          onClick={handleRemoveSignature}
                          className="absolute -top-1.5 -right-1.5 bg-red-500/80 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <label className="cursor-pointer flex-1">
                      <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                      <div className="w-full bg-white/5 border border-dashed border-white/15 p-5 text-center text-sm text-white/30 hover:text-white/50 hover:border-white/25 transition-all rounded-xl">
                        {signaturePreview ? 'Cambiar firma' : 'Subir firma digitalizada'}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 pt-5">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 bg-emerald-500/15 text-emerald-400 text-sm font-medium px-6 py-3.5 hover:bg-emerald-500/25 transition-all rounded-xl border border-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <KeyIcon className="w-5 h-5" /> Guardar Cambios
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowDoctorModal(false)} 
                  disabled={isSaving}
                  className="px-6 text-sm font-medium text-white/40 hover:text-white/70 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {showInstitutionModal && (
        <EditInstitutionModal
          open={showInstitutionModal}
          onClose={() => setShowInstitutionModal(false)}
          institution={activeInstitution}
        />
      )}
    </div>
  );
}