// src/pages/Settings/ConfigPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/Common/PageHeader";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { useSpecialtyChoices } from "@/hooks/settings/useSpecialtyChoices";
import EditInstitutionModal from "@/components/Settings/EditInstitutionModal";
import DoctorBankConfig from "@/components/Settings/DoctorBankConfig";
import { api } from "@/lib/apiClient";
import type { Specialty } from "@/types/config";
import { 
  FingerPrintIcon,
  ShieldCheckIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";
type WhatsAppForm = {
  whatsappEnabled: boolean;
  whatsappBusinessNumber: string;
  whatsappBusinessId: string;
  whatsappAccessToken: string;
  reminderHoursBefore: number;
};
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
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  
  const [doctorForm, setDoctorForm] = useState({
    full_name: "",
    gender: "M" as 'M' | 'F' | 'O',
    colegiado_id: "",
    license: "",
    email: "",
    phone: "",
    bio: "",
    photo_url: "",
    specialties: [] as Specialty[],
    signature: null as File | null,
  });
  
  const [whatsAppForm, setWhatsAppForm] = useState<WhatsAppForm>({
    whatsappEnabled: false,
    whatsappBusinessNumber: '',
    whatsappBusinessId: '',
    whatsappAccessToken: '',
    reminderHoursBefore: 24,
  });
  // ✅ Extraer datos bancarios del doctor
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
      photo_url: doc.photo_url || "",
      specialties: matched,
      signature: null,
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
    
    setInitialized(true);
  }, [doc, specialties, initialized]);
  // ✅ Handler para guardar datos bancarios
  const handleSaveBankData = async (bankData: { bank_name: string; bank_rif: string; bank_phone: string; bank_account: string }) => {
    await updateDoctor(bankData as any);  // ✅ FIX: as any para campos que no están en DoctorConfig
  };
  const handleSaveDoctor = async () => {
    const payload = { 
      ...doctorForm, 
      specialty_ids: doctorForm.specialties.map(s => s.id),
      ...whatsAppForm
    };
    await updateDoctor(payload);
    setShowDoctorModal(false);
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
                  onClick={() => {
                    if (doc?.id) navigate(`/doctor-profile/${doc.id}`);
                  }}
                  disabled={!doc?.id}
                  className={`w-full flex items-center justify-center gap-3 py-4 border border-emerald-500/10 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06] text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/50 hover:text-emerald-500 transition-all rounded-sm ${!doc?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <EyeIcon className="w-4 h-4" />
                  Visualizar Perfil Público
                </button>
              </div>
              
              {/* Especialidades */}
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
              
              {/* ✅ Componente de datos bancarios */}
              <DoctorBankConfig 
                bankName={bankData.bank_name}
                bankRif={bankData.bank_rif}
                bankPhone={bankData.bank_phone}
                bankAccount={bankData.bank_account}
                onUpdate={handleSaveBankData}
              />
              
              {/* ✅ Botón Editar Perfil */}
              <button 
                onClick={() => setShowDoctorModal(true)}
                className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-emerald-500/20 transition-all"
              >
                Editar Perfil del Doctor
              </button>
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
      
      {/* Modal de edición del doctor */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#0a0a0b] border border-white/10 w-full max-w-lg rounded-sm shadow-2xl my-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-bold">Editar Perfil del Doctor</h3>
              <button onClick={() => setShowDoctorModal(false)} className="text-white/50 hover:text-white">X</button>
            </div>
            <div className="p-6 space-y-6">
              {/* ... formulario de edición del doctor ... */}
              <button 
                onClick={handleSaveDoctor}
                className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-emerald-500/20 transition-all"
              >
                Guardar Cambios
              </button>
            </div>
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