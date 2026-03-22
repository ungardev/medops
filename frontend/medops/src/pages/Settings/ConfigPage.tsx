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
  // Estilos limpios (Tema Claro)
  const labelStyles = `text-xs font-semibold text-gray-600 mb-1 block`;
  const inputStyles = `w-full bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all`;
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
      
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "CONFIGURATION", active: true }
        ]}
        actions={
          <div className="flex h-10 w-10 items-center justify-center bg-white border border-gray-200 rounded-sm shadow-sm group cursor-help">
            <CommandLineIcon className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
          </div>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
        
        {/* SECCIÓN 1: PERFIL DEL DOCTOR */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1 border-l-2 border-emerald-600 ml-1">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Perfil del Doctor</h3>
          </div>
          
          <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm relative overflow-hidden">
            {!editingDoctor ? (
              <div className="space-y-6">
                {/* Información Básica */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-emerald-50 border border-emerald-200 flex items-center justify-center rounded-lg">
                    <FingerPrintIcon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 uppercase tracking-tight">
                        <span className="text-emerald-600 mr-2">{doc?.gender === 'F' ? 'Dra.' : 'Dr.'}</span>
                        {docForm.full_name || "Nombre Pendiente"}
                    </h4>
                    <p className="text-sm text-gray-600 font-medium mt-1">Licencia: {docForm.license || "No definida"}</p>
                    {doc?.is_verified && (
                        <div className="mt-2 inline-flex items-center gap-1 bg-emerald-100 px-2 py-0.5 rounded text-xs text-emerald-700 font-bold tracking-wider">
                            <ShieldCheckIcon className="w-3 h-3" /> Verificado
                        </div>
                    )}
                  </div>
                </div>
                {/* Botón "Ver Perfil Público" - CORREGIDO: Verificación de doc.id */}
                <div className="pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      if (doc?.id) {
                        navigate(`/doctor-profile/${doc.id}`);
                      } else {
                        alert("No se pudo obtener el ID del doctor. Intente nuevamente.");
                      }
                    }}
                    disabled={!doc?.id}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white text-sm font-bold uppercase tracking-wide rounded-md hover:bg-emerald-700 transition-colors shadow-sm ${!doc?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <EyeIcon className="w-5 h-5" />
                    Visualizar Perfil Público
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Vista previa como la verán los pacientes en el portal.
                  </p>
                </div>
                
                {/* Especialidades */}
                <div className="space-y-2">
                  <span className={labelStyles}>Especialidades Clínicas</span>
                  <div className="flex flex-wrap gap-2">
                      {docForm.specialties.map(s => (
                          <span key={s.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full border border-gray-200">
                              {s.name}
                          </span>
                      ))}
                  </div>
                </div>
                {/* WhatsApp (Colapsable) */}
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <button 
                    onClick={() => setIsWhatsAppOpen(!isWhatsAppOpen)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                       <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2325D366'%3E%3Cpath d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z'/%3E%3C/svg%3E" className="w-4 h-4" alt="WhatsApp" />
                       <span className="text-sm font-medium text-gray-700">WhatsApp Business</span>
                    </div>
                    {isWhatsAppOpen ? <ChevronDownIcon className="w-5 h-5 text-gray-500" /> : <ChevronRightIcon className="w-5 h-5 text-gray-500" />}
                  </button>
                  
                  {isWhatsAppOpen && (
                    <div className="p-4 bg-white border-t border-gray-200 space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="whatsappEnabled"
                          checked={whatsAppForm.whatsappEnabled}
                          onChange={(e) => setWhatsAppForm({...whatsAppForm, whatsappEnabled: e.target.checked})}
                          className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                        />
                        <label htmlFor="whatsappEnabled" className="text-sm text-gray-700 font-medium">
                          Habilitar WhatsApp
                        </label>
                      </div>
                      
                      {whatsAppForm.whatsappEnabled && (
                        <div className="grid grid-cols-2 gap-4 pl-7">
                          <div>
                            <label className={labelStyles}>Número de Negocio</label>
                            <input
                              type="text"
                              value={whatsAppForm.whatsappBusinessNumber}
                              onChange={(e) => setWhatsAppForm({...whatsAppForm, whatsappBusinessNumber: e.target.value})}
                              className={inputStyles}
                            />
                          </div>
                          <div>
                            <label className={labelStyles}>ID de Negocio</label>
                            <input
                              type="text"
                              value={whatsAppForm.whatsappBusinessId}
                              onChange={(e) => setWhatsAppForm({...whatsAppForm, whatsappBusinessId: e.target.value})}
                              className={inputStyles}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className={labelStyles}>Token de Acceso</label>
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
                {/* Botón Editar */}
                <button 
                  onClick={() => setEditingDoctor(true)} 
                  className="w-full flex items-center justify-center gap-3 py-3 border border-gray-300 bg-white text-gray-700 text-sm font-bold uppercase tracking-wide hover:bg-gray-50 transition-all rounded-md"
                >
                  <KeyIcon className="w-4 h-4" /> Editar Perfil
                </button>
              </div>
            ) : (
              /* FORMULARIO DE EDICIÓN */
              <form onSubmit={async (e) => { e.preventDefault(); await handleSaveDoctor(); }} className="space-y-6">
                 <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                        <label className={labelStyles}>Título</label>
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
                        <label className={labelStyles}>Nombre Completo</label>
                        <input className={inputStyles} value={docForm.full_name} onChange={(e) => setDocForm({...docForm, full_name: e.target.value})} />
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                   <div><label className={labelStyles}>Licencia</label><input className={inputStyles} value={docForm.license} onChange={(e) => setDocForm({...docForm, license: e.target.value})} /></div>
                   <div><label className={labelStyles}>Colegiado ID</label><input className={inputStyles} value={docForm.colegiado_id} onChange={(e) => setDocForm({...docForm, colegiado_id: e.target.value})} /></div>
                 </div>
                 
                 <div className="z-20 relative">
                   <label className={labelStyles}>Especialidades</label>
                   <SpecialtyComboboxElegante
                     value={docForm.specialties}
                     onChange={(next) => setDocForm({ ...docForm, specialties: next })}
                     options={specialties}
                   />
                 </div>
                 
                 <div className="grid grid-cols-1 gap-6">
                   <div>
                     <label className={labelStyles}>Biografía Pública</label>
                     <textarea 
                       className={inputStyles} 
                       value={docForm.bio || ""} 
                       onChange={(e) => setDocForm({...docForm, bio: e.target.value})}
                       rows={3}
                     />
                   </div>
                   <div>
                     <label className={labelStyles}>URL Foto de Perfil</label>
                     <input 
                       type="text"
                       className={inputStyles} 
                       value={docForm.photo_url || ""} 
                       onChange={(e) => setDocForm({...docForm, photo_url: e.target.value})}
                     />
                   </div>
                 </div>
                 <div className="bg-gray-50 p-4 border border-gray-200 rounded-md">
                   <label className={labelStyles}>Firma Digital</label>
                   <input type="file" onChange={handleSignatureUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                 </div>
                 
                 <div className="flex gap-4 pt-4">
                   <button type="submit" className="flex-1 bg-emerald-600 text-white text-sm font-bold px-6 py-3 rounded-md hover:bg-emerald-700 transition-colors">
                     Guardar Cambios
                   </button>
                   <button type="button" onClick={() => setEditingDoctor(false)} className="px-6 text-sm font-bold text-gray-500 hover:text-gray-700">Cancelar</button>
                 </div>
              </form>
            )}
          </div>
        </section>
        {/* SECCIÓN 2: INSTITUCIONES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1 border-l-2 border-emerald-600 ml-1">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Instituciones</h3>
            <button
              onClick={handleCreateInstitution}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              + NUEVA INSTITUCIÓN
            </button>
          </div>
          
          <div className="space-y-4">
            {multiInstLoading ? (
              <div className="h-32 bg-gray-100 animate-pulse rounded-md border border-gray-200" />
            ) : institutions.length === 0 ? (
              <div className="p-8 bg-white border border-gray-200 rounded-md text-center">
                <p className="text-gray-500 text-sm">
                  No hay instituciones configuradas. Click en "+ NUEVA INSTITUCIÓN".
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Institución Activa */}
                {activeInstitution && (
                  <div className="relative group">
                    <div className="absolute -left-1 top-0 bottom-0 w-1 bg-emerald-600 rounded-sm" />
                    <div className="bg-white border-2 border-emerald-200 rounded-md p-4 shadow-sm">
                       <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <BuildingOfficeIcon className="w-5 h-5 text-emerald-600" />
                            <span className="font-bold text-gray-900">{activeInstitution.name || "Institución Activa"}</span>
                            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">Activa</span>
                          </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => handleEditInstitution(activeInstitution)} className="p-1 text-gray-400 hover:text-blue-600"><PencilIcon className="w-4 h-4" /></button>
                             <button onClick={() => handleDeleteInstitution(activeInstitution.id)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                          </div>
                       </div>
                       <p className="text-xs text-gray-500 ml-7">ID Fiscal: {activeInstitution.tax_id || "N/A"}</p>
                    </div>
                  </div>
                )}
                {/* Otras Instituciones */}
                {institutions.filter(inst => inst.id !== activeInstitution?.id).map((inst) => (
                  <div key={inst.id} className="bg-white border border-gray-200 rounded-md p-4 shadow-sm group hover:border-gray-300 transition-colors">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                           <span className="font-medium text-gray-700">{inst.name || "Institución"}</span>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => handleSelectInstitution(inst.id)} className="text-xs text-emerald-600 hover:underline mr-2">Activar</button>
                           <button onClick={() => handleEditInstitution(inst)} className="p-1 text-gray-400 hover:text-blue-600"><PencilIcon className="w-4 h-4" /></button>
                           <button onClick={() => handleDeleteInstitution(inst.id)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Info helper */}
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
             <div className="flex items-start gap-3">
                <BuildingOfficeIcon className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="text-xs text-blue-800 leading-relaxed">
                  <p className="font-bold mb-1">Protocolo Multi-Institución:</p>
                  Selecciona una institución como "Activa" para establecerla como predeterminada. Los cambios afectan todos los documentos médicos hasta que se seleccione otra.
                </div>
             </div>
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