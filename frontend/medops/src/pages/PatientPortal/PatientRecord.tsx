// src/pages/PatientPortal/PatientRecord.tsx
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePatient } from "@/hooks/patients/usePatient";
import { useConsultationsByPatient } from "@/hooks/patients/useConsultationsByPatient";
import { Tabs, Tab } from "@/components/ui/Tabs";
import PatientInfoTab from "@/components/Patients/PatientInfoTab";
import PatientConsultationsTab from "@/components/Patients/PatientConsultationsTab";
import PatientDocumentsTab from "@/components/Patients/PatientDocumentsTab";
import PatientPaymentsTab from "@/components/Patients/PatientPaymentsTab";
import PatientPendingAppointmentsTab from "@/components/Patients/PatientPendingAppointmentsTab";
import PatientEventsTab from "@/components/Patients/PatientEventsTab";
import VaccinationTab from "@/components/Patients/VaccinationTab";
import SurgeriesTab from "@/components/Patients/SurgeriesTab";
import PageHeader from "@/components/Common/PageHeader";
import { IdentificationIcon, HeartIcon, UserIcon } from "@heroicons/react/24/outline";
import { useState, useEffect, useMemo } from "react";
import { usePatientAuth } from "@/hooks/patient/usePatientAuth"; 
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
export default function PatientRecord() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, patient: authPatient } = usePatientAuth();
  // Efecto para navegación condicional (evita bucle infinito)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/patient/login");
    }
  }, [authLoading, isAuthenticated, navigate]);
  // Loader mientras se verifica autenticación
  if (authLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-blue-500">Verificando Autenticación...</p>
        </div>
      </div>
    );
  }
  // Si no está autenticado, no renderizar nada
  if (!isAuthenticated) {
    return null;
  }
  // Obtener ID del paciente
  const patientId = authPatient?.id ?? Number(localStorage.getItem("patient_id"));
  console.log('🔴 DEBUG PatientRecord - authPatient:', authPatient);
  console.log('🔴 DEBUG PatientRecord - localStorage patient_id:', localStorage.getItem("patient_id"));
  console.log('🔴 DEBUG PatientRecord - patientId calculado:', patientId);
  
  if (!patientId) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-red-500">Error: No se encontró ID de paciente</p>
        </div>
      </div>
    );
  }
  const { data: patient, isLoading, error } = usePatient(patientId);
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentTab, setCurrentTab] = useState(() => normalizeTab(searchParams.get("tab") ?? "info"));
  const { data: completedConsultations } = useConsultationsByPatient(patientId);
  const appointmentsList = completedConsultations?.list ?? [];
  
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
  
  const patientAge = patient.age ?? calculateAge(patient.birthdate);
  const weightDisplay = latestBiometrics.weight ? `${latestBiometrics.weight} KG` : "--";
  const heightDisplay = latestBiometrics.height ? `${latestBiometrics.height} CM` : "--";
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "MI EXPEDIENTE", active: true }
        ]}
        stats={[
          { 
            label: "RECORD_STATE", 
            value: patient.active ? "ACTIVE" : "INACTIVE",
            color: patient.active ? "text-emerald-500" : "text-red-500"
          },
          { 
            label: "BIOMETRIC_AGE", 
            value: patientAge ? `${patientAge} YRS` : "--",
            color: "text-purple-400"
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
          <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/5 shadow-inner">
            <UserIcon className="w-5 h-5 text-blue-500" />
          </div>
        }
      />
      
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
      </div>
      
      <div className="border border-white/10 rounded-sm overflow-hidden shadow-2xl">
        <Tabs value={currentTab} onChange={setTab} layout="horizontal">
          <Tab id="info" label="Identity_Core">
            <PatientInfoTab patientId={patientId} readOnly={true} />
          </Tab>
          <Tab id="consultas" label="Clinical_Ledger">
            <PatientConsultationsTab patient={patient} readOnly={true} />
          </Tab>
          <Tab id="documentos" label="Archive_Vault">
            <PatientDocumentsTab patient={patient} />
          </Tab>
          <Tab id="vacunacion" label="Immunology">
            <VaccinationTab patientId={patientId} onRefresh={() => {}} readOnly={true} />
          </Tab>
          <Tab id="cirugias" label="Surgical_Ops">
            <SurgeriesTab patientId={patientId} onRefresh={() => {}} readOnly={true} />
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