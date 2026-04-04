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
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/patient/login");
    }
  }, [authLoading, isAuthenticated, navigate]);
  if (authLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-[10px] text-emerald-400/60">Verificando autenticación...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return null;
  }
  const patientId = Number(localStorage.getItem("patient_id")) || authPatient?.id;
  
  if (!patientId) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-[10px] text-red-400">Error: No se encontró ID de paciente</p>
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
        <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-[10px] text-emerald-400/60">Cargando expediente...</p>
      </div>
    </div>
  );
  
  if (error || !patient) return (
    <div className="p-8">
      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
        <p className="text-[10px] text-red-400">Error al cargar los datos del paciente</p>
      </div>
    </div>
  );
  
  const patientAge = patient.age ?? calculateAge(patient.birthdate);
  const weightDisplay = latestBiometrics.weight ? `${latestBiometrics.weight} KG` : "--";
  const heightDisplay = latestBiometrics.height ? `${latestBiometrics.height} CM` : "--";
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "Mi Expediente", active: true }
        ]}
        stats={[
          { 
            label: "Estado", 
            value: patient.active ? "Activo" : "Inactivo",
            color: patient.active ? "text-emerald-400" : "text-red-400"
          },
          { 
            label: "Edad", 
            value: patientAge ? `${patientAge} años` : "--",
            color: "text-white/60"
          },
          { 
            label: "Peso", 
            value: weightDisplay,
            color: weightDisplay !== "--" ? "text-white/60" : "text-white/20"
          },
          { 
            label: "Talla", 
            value: heightDisplay,
            color: heightDisplay !== "--" ? "text-white/60" : "text-white/20"
          }
        ]}
        actions={
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5">
            <UserIcon className="w-5 h-5 text-white/30" />
          </div>
        }
      />
      
      <div className="flex flex-wrap items-center gap-6 px-5 py-3 bg-white/5 border border-white/15 rounded-lg text-[10px] text-white/30">
        <span className="flex items-center gap-2">
          <IdentificationIcon className="w-4 h-4 text-blue-400/40" />
          <span className="text-white/10">Cédula:</span> 
          <span className="text-white/70 font-medium">{patient.national_id || "—"}</span>
        </span>
        <span className="flex items-center gap-2">
          <HeartIcon className="w-4 h-4 text-red-400/30" />
          <span className="text-white/10">Nacimiento:</span> 
          <span className="text-white/70 font-medium">{patient.birthdate ? new Date(patient.birthdate).toLocaleDateString("es-VE") : '—'}</span>
        </span>
      </div>
      
      <div className="border border-white/15 rounded-lg overflow-hidden">
        <Tabs value={currentTab} onChange={setTab} layout="horizontal">
          <Tab id="info" label="Información">
            <PatientInfoTab patientId={patientId} readOnly={true} />
          </Tab>
          <Tab id="consultas" label="Consultas">
            <PatientConsultationsTab patient={patient} readOnly={true} />
          </Tab>
          <Tab id="documentos" label="Documentos">
            <PatientDocumentsTab patient={patient} />
          </Tab>
          <Tab id="vacunacion" label="Vacunación">
            <VaccinationTab patientId={patientId} onRefresh={() => {}} readOnly={true} />
          </Tab>
          <Tab id="cirugias" label="Cirugías">
            <SurgeriesTab patientId={patientId} onRefresh={() => {}} readOnly={true} />
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
    </div>
  );
}