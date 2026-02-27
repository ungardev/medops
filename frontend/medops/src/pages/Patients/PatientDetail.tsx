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
// Iconos para el Header
import { 
  IdentificationIcon, 
  HeartIcon, 
  GlobeAltIcon,
  UserIcon,
  BeakerIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../../api/client";
// 🆕 OPCIONES DE TIPOS DE SANGRE DEL MODELO PATIENT
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
// 🆕 INTERFACE PARA VITAL SIGNS
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
// 🆕 INTERFACE PARA APPOINTMENT CON VITAL SIGNS
interface AppointmentWithVitals {
  id: number;
  appointment_date: string;
  status: string;
  vital_signs?: VitalSignsData | null;
  weight?: string | number | null;
  height?: string | number | null;
}
export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);
  const { data: patient, isLoading, error } = usePatient(patientId);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [currentTab, setCurrentTab] = useState(() => normalizeTab(searchParams.get("tab") ?? "info"));
  
  // 🆕 ESTADO PARA BLOOD_TYPE EDITABLE
  const [editableBloodType, setEditableBloodType] = useState<string>("");
  const [isUpdatingBloodType, setIsUpdatingBloodType] = useState(false);
  // 🆕 OBTENER APPOINTMENTS COMPLETADOS DEL PACIENTE
  const { data: completedConsultations } = useConsultationsByPatient(patientId);
  // 🆕 CORRECCIÓN: El hook devuelve { list: Appointment[], totalCount: number }
  const appointmentsList: AppointmentWithVitals[] = completedConsultations?.list ?? [];
  // 🆕 SYNCHRONIZE blood_type CUANDO CAMBIA EL PACIENTE
  useEffect(() => {
    if (patient?.blood_type) {
      setEditableBloodType(patient.blood_type);
    }
  }, [patient?.blood_type]);
  // 🆕 OBTENER WEIGHT Y HEIGHT DEL ÚLTIMO APPOINTMENT COMPLETADO (DESDE VITAL_SIGNS)
  const latestBiometrics = useMemo(() => {
    if (!appointmentsList || appointmentsList.length === 0) {
      return { weight: null, height: null };
    }
    
    // Ordenar por fecha descendente (más reciente primero)
    const sorted = [...appointmentsList].sort((a, b) => {
      const dateA = new Date(a.appointment_date || 0).getTime();
      const dateB = new Date(b.appointment_date || 0).getTime();
      return dateB - dateA;
    });
    
    // Buscar el primer appointment con vital_signs
    for (const appt of sorted) {
      // 🆕 FIX: Leer desde vital_signs primero (viene del backend con datos)
      if (appt.vital_signs?.weight || appt.vital_signs?.height) {
        return { 
          weight: appt.vital_signs?.weight ? Number(appt.vital_signs.weight) : null, 
          height: appt.vital_signs?.height ? Number(appt.vital_signs.height) : null 
        };
      }
      // Fallback: leer desde campos directos del appointment
      if (appt.weight || appt.height) {
        return { 
          weight: appt.weight ? Number(appt.weight) : null, 
          height: appt.height ? Number(appt.height) : null 
        };
      }
    }
    
    return { weight: null, height: null };
  }, [appointmentsList]);
  // 🆕 FUNCIÓN PARA GUARDAR BLOOD_TYPE
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
        <p className="text-[10px] font-mono text-red-500 uppercase">Error_Data_Link_Broken: Subject not found or connection failed.</p>
      </div>
    </div>
  );
  // 🆕 CALCULAR EDAD DESDE birthdate SI NO VIENE DEL BACKEND
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
  // 🆕 FORMATEAR VALORES BIOMÉTRICOS
  const weightDisplay = latestBiometrics.weight ? `${latestBiometrics.weight} KG` : "--";
  const heightDisplay = latestBiometrics.height ? `${latestBiometrics.height} CM` : "--";
  const bloodTypeDisplay = editableBloodType || "--";
  const ageDisplay = patientAge ? `${patientAge} YRS` : "--";
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
       
      {/* 🚀 ELITE_PAGE_HEADER: IDENTITY & TELEMETRY */}
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
            {/* 🆕 SELECTOR DE BLOOD_GROUP EDITABLE */}
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
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
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
      
      {/* 📊 SUB-METADATA BAR (DNI, DOB, COUNTRY) */}
      <div className="flex flex-wrap items-center gap-8 px-6 py-4 bg-black/40 border border-white/5 rounded-sm text-[10px] font-mono text-white/20 uppercase tracking-widest">
        <span className="flex items-center gap-2.5">
          <IdentificationIcon className="w-4 h-4 text-blue-500/40" />
          <span className="text-white/10">DNI:</span> <span className="text-white/80 font-bold">{patient.national_id || "NOT_ASSIGNED"}</span>
        </span>
        <span className="flex items-center gap-2.5">
          <HeartIcon className="w-4 h-4 text-red-500/30" />
          <span className="text-white/10">DOB:</span> <span className="text-white/80 font-bold">{patient.birthdate ? new Date(patient.birthdate).toLocaleDateString("es-VE") : 'NOT_SET'}</span>
        </span>
        {patient.birth_country && (
          <span className="flex items-center gap-2.5">
            <GlobeAltIcon className="w-4 h-4 text-emerald-500/30" />
            <span className="text-white/10">ORIGIN:</span> <span className="text-white/80 font-bold">{patient.birth_country}</span>
          </span>
        )}
      </div>
      
      {/* 🛠️ MODULAR DATA ENGINE (TABS) - CORREGIDO PARA CONTEXTO HORIZONTAL */}
      <div className="border border-white/10 rounded-sm overflow-hidden shadow-2xl">
        <Tabs
          value={currentTab}
          onChange={setTab}
          layout="horizontal"
        >
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
    </div>
  );
}