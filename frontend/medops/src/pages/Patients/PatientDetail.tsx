// src/pages/Patients/PatientDetail.tsx
import { useParams, useSearchParams } from "react-router-dom";
import { usePatient } from "../../hooks/patients/usePatient";
import { useConsultationsByPatient } from "../../hooks/patients/useConsultationsByPatient";
import { Tabs, Tab } from "../../components/ui/Tabs";
import PatientInfoTab from "../../components/Patients/PatientInfoTab";
import PatientConsultationsTab from "../../components/Patients/PatientConsultationsTab";
import PatientDocumentsTab from "../../components/Patients/PatientDocumentsTab";
import PatientPaymentsTab from "../../components/Patients/PatientPaymentsTab";
import PatientPendingAppointmentsTab from "../../components/Patients/PatientPendingAppointmentsTab";
import PatientEventsTab from "../../components/Patients/PatientEventsTab";
import VaccinationTab from "../../components/Patients/VaccinationTab";
import SurgeriesTab from "../../components/Patients/SurgeriesTab";
import HospitalizationsTab from "../../components/Patients/HospitalizationsTab";
import PageHeader from "../../components/Common/PageHeader";
import InvitePatientModal from "../../components/Patients/InvitePatientModal";
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
    hospitalizacion: "hospitalizacion",
  };
  if (!id) return "info";
  return map[id.toLowerCase()] ?? id;
}
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
interface InvitationStatusResponse {
  has_invitation: boolean;
  has_portal_access: boolean;
}
export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);
  const { data: patient, isLoading, error, refetch } = usePatient(patientId);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [currentTab, setCurrentTab] = useState(() => normalizeTab(searchParams.get("tab") ?? "info"));
  
  const [editableBloodType, setEditableBloodType] = useState<string>("");
  const [isUpdatingBloodType, setIsUpdatingBloodType] = useState(false);
  
  const [portalStatus, setPortalStatus] = useState<PortalStatus>({ has_invitation: false, has_portal_access: false });
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  const { data: completedConsultations } = useConsultationsByPatient(patientId);
  const appointmentsList: AppointmentWithVitals[] = completedConsultations?.list ?? [];
  
  useEffect(() => {
    const checkPortalStatus = async () => {
      try {
        const data = await apiFetch<InvitationStatusResponse>(
          `patients/${patientId}/invitation-status/`
        );
        setPortalStatus({ 
          has_invitation: data.has_invitation, 
          has_portal_access: data.has_portal_access 
        });
      } catch (err) {
        console.error('Error checking portal status:', err);
      }
    };
    checkPortalStatus();
  }, [patientId]);
  
  useEffect(() => {
    if (patient?.blood_type) {
      setEditableBloodType(patient.blood_type);
    }
  }, [patient?.blood_type]);
  
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
  
  const handleInviteSuccess = async () => {
    try {
      const data = await apiFetch<InvitationStatusResponse>(
        `patients/${patientId}/invitation-status/`
      );
      setPortalStatus({ 
        has_invitation: data.has_invitation, 
        has_portal_access: data.has_portal_access 
      });
    } catch (err) {
      console.error('Error refreshing portal status:', err);
      setPortalStatus({ has_invitation: true, has_portal_access: false });
    }
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
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] text-emerald-400">Cargando datos del paciente...</p>
      </div>
    </div>
  );
  
  if (error || !patient) return (
    <div className="p-8">
      <div className="bg-red-500/10 border border-red-500/25 p-4 rounded-lg">
        <p className="text-[11px] text-red-400">Error al cargar los datos del paciente</p>
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
  const weightDisplay = latestBiometrics.weight ? `${latestBiometrics.weight} kg` : "—";
  const heightDisplay = latestBiometrics.height ? `${latestBiometrics.height} cm` : "—";
  const bloodTypeDisplay = editableBloodType || "—";
  const ageDisplay = patientAge ? `${patientAge} años` : "—";
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "Pacientes", path: "/patients" },
          { label: patient.full_name, active: true }
        ]}
        stats={[
          { 
            label: "Estado", 
            value: patient.active ? "Activo" : "Inactivo",
            color: patient.active ? "text-emerald-400" : "text-red-400"
          },
          { 
            label: "Edad", 
            value: ageDisplay,
            color: ageDisplay !== "—" ? "text-white" : "text-white/30"
          },
          { 
            label: "Peso", 
            value: weightDisplay,
            color: weightDisplay !== "—" ? "text-white" : "text-white/30"
          },
          { 
            label: "Talla", 
            value: heightDisplay,
            color: heightDisplay !== "—" ? "text-white" : "text-white/30"
          }
        ]}
        actions={
          <div className="flex items-center gap-3">
            {portalStatus.has_portal_access ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/15 border border-emerald-500/25 rounded-lg">
                <span className="text-[10px] font-medium text-emerald-400">Portal Activo</span>
              </div>
            ) : (
              <>
                {portalStatus.has_invitation && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/15 border border-amber-500/25 rounded-lg">
                    <span className="text-[10px] font-medium text-amber-400">Invitación Pendiente</span>
                  </div>
                )}
                
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/25 text-blue-400 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  <span className="text-[10px] font-medium">
                    {portalStatus.has_invitation ? 'Re-enviar Invitación' : 'Invitar al Portal'}
                  </span>
                </button>
              </>
            )}
            
            <div className="flex items-center gap-2">
              <BeakerIcon className="w-4 h-4 text-red-400" />
              <select
                value={editableBloodType}
                onChange={(e) => {
                  setEditableBloodType(e.target.value);
                  handleBloodTypeSave(e.target.value);
                }}
                disabled={isUpdatingBloodType}
                className="bg-white/5 border border-red-500/25 text-red-400 text-[11px] font-medium px-3 py-2 rounded-lg focus:outline-none focus:border-red-500/50"
              >
                <option value="">Tipo</option>
                {BLOOD_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {isUpdatingBloodType && (
                <ArrowPathIcon className="w-4 h-4 text-red-400 animate-spin" />
              )}
            </div>
            
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5">
               <UserIcon className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        }
      />
      
      <div className="flex flex-wrap items-center gap-6 px-5 py-3 bg-white/5 border border-white/15 rounded-lg text-[11px] text-white/50">
        <span className="flex items-center gap-2">
          <IdentificationIcon className="w-4 h-4 text-blue-400/50" />
          <span className="text-white/30">Cédula:</span> 
          <span className="text-white/70 font-medium">{patient.national_id || "—"}</span>
        </span>
        <span className="flex items-center gap-2">
          <HeartIcon className="w-4 h-4 text-red-400/50" />
          <span className="text-white/30">Fecha Nac.:</span> 
          <span className="text-white/70 font-medium">{patient.birthdate ? new Date(patient.birthdate).toLocaleDateString("es-VE") : '—'}</span>
        </span>
        {patient.birth_country && (
          <span className="flex items-center gap-2">
            <GlobeAltIcon className="w-4 h-4 text-emerald-400/50" />
            <span className="text-white/30">Origen:</span> 
            <span className="text-white/70 font-medium">{patient.birth_country}</span>
          </span>
        )}
      </div>
      
      <div className="border border-white/15 rounded-lg overflow-hidden">
        <Tabs value={currentTab} onChange={setTab} layout="horizontal">
          <Tab id="info" label="Información">
            <PatientInfoTab patientId={patientId} />
          </Tab>
          <Tab id="consultas" label="Consultas">
            <PatientConsultationsTab patient={patient} />
          </Tab>
          <Tab id="documentos" label="Documentos">
            <PatientDocumentsTab patient={patient} />
          </Tab>
          <Tab id="vacunacion" label="Vacunación">
            <VaccinationTab patientId={patientId} onRefresh={() => {}} />
          </Tab>
          <Tab id="cirugias" label="Cirugías">
            <SurgeriesTab patientId={patientId} onRefresh={() => {}} />
          </Tab>
          <Tab id="hospitalizacion" label="Hospitalización">
            <HospitalizationsTab patientId={patientId} onRefresh={() => {}} />
          </Tab>
          <Tab id="citas" label="Citas">
            <PatientPendingAppointmentsTab patient={patient} />
          </Tab>
          <Tab id="pagos" label="Pagos">
            <PatientPaymentsTab patient={patient} />
          </Tab>
          <Tab id="eventos" label="Eventos">
            <PatientEventsTab patient={patient} />
          </Tab>
        </Tabs>
      </div>
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