// src/pages/Patients/PatientDetail.tsx
import { useParams, useSearchParams } from "react-router-dom";
import { usePatient } from "../../hooks/patients/usePatient";
import { useConsultationsByPatient } from "../../hooks/patients/useConsultationsByPatient";
import { Tabs, Tab } from "../../components/ui/Tabs";
// Componentes de Pestañas
import PatientInfoTab from "../../components/Patients/PatientInfoTab";
import PatientConsultationsTab from "../../components/Patients/PatientConsultationsTab";
import PatientDocumentsTab from "../../components/Patients/PatientDocumentsTab";
import PatientPaymentsTab from "../../components/Patients/PatientPaymentsTab";
import PatientPendingAppointmentsTab from "../../components/Patients/PatientPendingAppointmentsTab";
import PatientEventsTab from "../../components/Patients/PatientEventsTab";
import VaccinationTab from "../../components/Patients/VaccinationTab";
import SurgeriesTab from "../../components/Patients/SurgeriesTab";
// Componentes de Common
import PageHeader from "../../components/Common/PageHeader";
import InvitePatientModal from "../../components/Patients/InvitePatientModal";
// Iconos
import { 
  IdentificationIcon, 
  HeartIcon, 
  GlobeAltIcon,
  UserIcon,
  BeakerIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { Plus } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../api/client";
// Opciones de tipos de sangre
const BLOOD_TYPE_OPTIONS = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];
function normalizeTab(id?: string): string {
  const map: Record<string, string> = {
    info: "info",
    consultas: "consultas",
    documents: "documentos",
    documentos: "documentos",
    pagos: "pagos",
    citas: "citas",
    events: "eventos",
    eventos: "eventos",
    vacunación: "vacunacion",
    cirugias: "cirugias",
  };
  if (!id) return "info";
  return map[id.toLowerCase()] ?? id;
}
// Interfaces
interface VitalSignsData {
  id: number;
  weight?: string | null;
  height?: string | null;
  temperature?: string | null;
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  oxygen_saturation?: number | null;
  bmi?: number | null;
}
interface AppointmentWithVitals {
  id: number;
  appointment_date: string;
  status: string;
  vital_signs?: VitalSignsData | null;
  weight?: string | number | null;
  height?: string | number | null;
}
interface PortalStatus {
  has_invitation: boolean;
  has_portal_access: boolean;
}
export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);
  const { data: patient, isLoading, error, refetch } = usePatient(patientId);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [currentTab, setCurrentTab] = useState(() => normalizeTab(searchParams.get("tab") ?? "info"));
  
  // Estado para blood type
  const [editableBloodType, setEditableBloodType] = useState<string>("");
  const [isUpdatingBloodType, setIsUpdatingBloodType] = useState(false);
  
  // Estado para portal
  const [portalStatus, setPortalStatus] = useState<PortalStatus>({ has_invitation: false, has_portal_access: false });
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Obtener appointments completados
  const { data: completedConsultations } = useConsultationsByPatient(patientId);
  const appointmentsList: AppointmentWithVitals[] = completedConsultations?.list ?? [];
  
  // Cargar estado del portal
  useEffect(() => {
    const checkPortalStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/patients/${patientId}/invitation-status/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPortalStatus({ has_invitation: data.has_invitation, has_portal_access: data.has_portal_access });
        }
      } catch (err) {
        console.error('Error checking portal status:', err);
      }
    };
    checkPortalStatus();
  }, [patientId]);
  // Sync blood_type
  useEffect(() => {
    if (patient?.blood_type) {
      setEditableBloodType(patient.blood_type);
    }
  }, [patient?.blood_type]);
  // Obtener biometrics
  const latestBiometrics = useMemo(() => {
    if (!appointmentsList || appointmentsList.length === 0) {
      return { weight: null, height: null };
    }
    
    const sorted = [...appointmentsList].sort((a, b) => {
      const dateA = new Date(a.appointment_date || 0).getTime();
      const dateB = new Date(b.appointment_date || 0).getTime();
      return dateB - dateA;
    });
    
    for (const appt of sorted) {
      if (appt.vital_signs?.weight || appt.vital_signs?.height) {
        return { 
          weight: appt.vital_signs?.weight ? Number(appt.vital_signs.weight) : null, 
          height: appt.vital_signs?.height ? Number(appt.vital_signs.height) : null 
        };
      }
      if (appt.weight || appt.height) {
        return { 
          weight: appt.weight ? Number(appt.weight) : null, 
          height: appt.height ? Number(appt.height) : null 
        };
      }
    }
    
    return { weight: null, height: null };
  }, [appointmentsList]);
  // Guardar blood_type
  const handleBloodTypeSave = async (newBloodType: string) => {
    if (!patientId) return;
    
    setIsUpdatingBloodType(true);
    try {
      await apiFetch(`patients/${patientId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blood_type: newBloodType }),
      });
      setEditableBloodType(newBloodType);
    } catch (err) {
      console.error("Error updating blood_type:", err);
    } finally {
      setIsUpdatingBloodType(false);
    }
  };
  
  // Refrescar estado del portal
  const handleInviteSuccess = () => {
    setPortalStatus({ has_invitation: true, has_portal_access: false });
    refetch();
  };
  useEffect(() => {
    const tabFromUrl = normalizeTab(searchParams.get("tab") ?? "info");
    if (tabFromUrl !== currentTab) {
      setCurrentTab(tabFromUrl);
    }
  }, [searchParams, currentTab]);
  
  const setTab = (next: string) => {
    const normalized = normalizeTab(next);
    setCurrentTab(normalized);
    setSearchParams({ tab: normalized });
  };
  
  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-blue-500">Syncing_Subject_Data...</p>
      </div>
    </div>
  );
  
  if (error || !patient) return (
    <div className="p-8">
      <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm">
        <p className="text-[10px] font-mono text-red-500 uppercase">Error_Data_Link_Broken</p>
      </div>
    </div>
  );
  const calculateAge = (birthdate: string | null | undefined): number | null => {
    if (!birthdate) return null;
    const birth = new Date(birthdate);
    const today = new Date();
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };
  
  const patientAge = patient.age ?? calculateAge(patient.birthdate);
  const weightDisplay = latestBiometrics.weight ? `${latestBiometrics.weight} KG` : "--";
  const heightDisplay = latestBiometrics.height ? `${latestBiometrics.height} CM` : "--";
  const bloodTypeDisplay = editableBloodType || "--";
  const ageDisplay = patientAge ? `${patientAge} YRS` : "--";
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      {/* Page Header */}
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "PATIENTS", path: "/patients" },
          { label: `SUBJECT_ID_${patient.id.toString().padStart(2, '0')}`, active: true }
        ]}
        stats={[
          { 
            label: "RECORD_STATE", 
            value: patient.active ? "ACTIVE" : "INACTIVE",
            color: patient.active ? "text-emerald-500" : "text-red-500"
          },
          { 
            label: "BIOMETRIC_AGE", 
            value: ageDisplay,
            color: ageDisplay !== "--" ? "text-purple-400" : "text-white/30"
          },
          { 
            label: "MASS_INDEX", 
            value: weightDisplay,
            color: weightDisplay !== "--" ? "text-orange-400" : "text-white/30"
          },
          { 
            label: "HEIGHT_INDEX", 
            value: heightDisplay,
            color: heightDisplay !== "--" ? "text-cyan-400" : "text-white/30"
          }
        ]}
        actions={
          <div className="flex items-center gap-3">
            {/* 🆕 BADGE MEDOPZ PATIENT */}
            {portalStatus.has_portal_access ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-sm">
                <span className="text-[9px] font-bold text-emerald-400 uppercase">MEDOPZ Patient</span>
              </div>
            ) : portalStatus.has_invitation ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-sm">
                <span className="text-[9px] font-bold text-amber-400 uppercase">Invitación Pendiente</span>
              </div>
            ) : (
              <button 
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 border border-blue-500/40 rounded-sm transition-colors"
              >
                <Plus size={14} className="text-white" />
                <span className="text-[9px] font-bold text-white uppercase">Invitar al Portal</span>
              </button>
            )}
            
            {/* Blood Type Selector */}
            <div className="flex items-center gap-2">
              <BeakerIcon className="w-4 h-4 text-red-400" />
              <select
                value={editableBloodType}
                onChange={(e) => {
                  setEditableBloodType(e.target.value);
                  handleBloodTypeSave(e.target.value);
                }}
                disabled={isUpdatingBloodType}
                className="bg-black/40 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase px-3 py-2 rounded-sm focus:outline-none focus:border-red-500/50"
              >
                <option value="">SELECT</option>
                {BLOOD_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {isUpdatingBloodType && (
                <ArrowPathIcon className="w-4 h-4 text-red-400 animate-spin" />
              )}
            </div>
            
            <div className="flex flex-col items-end px-3 border-r border-white/10">
                <span className="text-[8px] font-mono text-white/30 uppercase tracking-tighter">Blood_Group</span>
                <span className="text-xs font-black text-red-500">{bloodTypeDisplay}</span>
            </div>
            
            <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/5 shadow-inner">
               <UserIcon className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        }
      />
      
      {/* Metadata Bar */}
      <div className="flex flex-wrap items-center gap-8 px-6 py-4 bg-black/40 border border-white/5 rounded-sm text-[10px] font-mono text-white/20 uppercase tracking-widest">
        <span className="flex items-center gap-2.5">
          <IdentificationIcon className="w-4 h-4 text-blue-500/40" />
          <span className="text-white/10">DNI:</span> 
          <span className="text-white/80 font-bold">{patient.national_id || "NOT_ASSIGNED"}</span>
        </span>
        <span className="flex items-center gap-2.5">
          <HeartIcon className="w-4 h-4 text-red-500/30" />
          <span className="text-white/10">DOB:</span> 
          <span className="text-white/80 font-bold">{patient.birthdate ? new Date(patient.birthdate).toLocaleDateString("es-VE") : 'NOT_SET'}</span>
        </span>
        {patient.birth_country && (
          <span className="flex items-center gap-2.5">
            <GlobeAltIcon className="w-4 h-4 text-emerald-500/30" />
            <span className="text-white/10">ORIGIN:</span> 
            <span className="text-white/80 font-bold">{patient.birth_country}</span>
          </span>
        )}
      </div>
      
      {/* Tabs */}
      <div className="border border-white/10 rounded-sm overflow-hidden shadow-2xl">
        <Tabs value={currentTab} onChange={setTab} layout="horizontal">
          <Tab id="info" label="Identity_Core">
            <PatientInfoTab patientId={patientId} />
          </Tab>
          <Tab id="consultas" label="Clinical_Ledger">
            <PatientConsultationsTab patient={patient} />
          </Tab>
          <Tab id="documentos" label="Archive_Vault">
            <PatientDocumentsTab patient={patient} />
          </Tab>
          <Tab id="vacunacion" label="Immunology">
            <VaccinationTab patientId={patientId} onRefresh={() => {}} />
          </Tab>
          <Tab id="cirugias" label="Surgical_Ops">
            <SurgeriesTab patientId={patientId} onRefresh={() => {}} />
          </Tab>
          <Tab id="citas" label="Logistics_Schedule">
            <PatientPendingAppointmentsTab patient={patient} />
          </Tab>
          <Tab id="pagos" label="Financial_Flow">
            <PatientPaymentsTab patient={patient} />
          </Tab>
          <Tab id="eventos" label="Audit_Log">
            <PatientEventsTab patient={patient} />
          </Tab>
        </Tabs>
      </div>
      {/* Modal de Invitación */}
      <InvitePatientModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        patientId={patientId}
        patientName={patient.full_name}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
}