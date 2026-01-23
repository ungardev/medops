// src/pages/Patients/PatientDetail.tsx
import { useParams, useSearchParams } from "react-router-dom";
import { usePatient } from "../../hooks/patients/usePatient";
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
  UserIcon
} from "@heroicons/react/24/outline";
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
    vacunacion: "vacunacion",
    cirugias: "cirugias",
  };
  if (!id) return "info";
  return map[id.toLowerCase()] ?? id;
}
export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patientId = Number(id);
  const { data: patient, isLoading, error } = usePatient(patientId);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = normalizeTab(searchParams.get("tab") ?? "info");
  const setTab = (next: string) => {
    const normalized = normalizeTab(next);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("tab", normalized);
      return p;
    });
  };
  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      
      {/* 🚀 ELITE_PAGE_HEADER: IDENTITY & TELEMETRY */}
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "PATIENTS", path: "/patients" },
          { label: `SUBJECT_ID_${patient.id.toString().padStart(6, '0')}`, active: true }
        ]}
        stats={[
          { 
            label: "RECORD_STATE", 
            value: patient.active ? "ACTIVE" : "INACTIVE",
            color: patient.active ? "text-emerald-500" : "text-red-500"
          },
          { 
            label: "BIOMETRIC_AGE", 
            value: `${patient.age || '--'} YRS`,
            color: "text-blue-500"
          },
          { 
            label: "MASS_INDEX", 
            value: `${patient.weight || '--'} KG`,
            color: "text-white/60"
          },
          { 
            label: "HEIGHT_INDEX", 
            value: `${patient.height || '--'} CM`,
            color: "text-white/60"
          }
        ]}
        actions={
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end px-3 border-r border-white/10">
                <span className="text-[8px] font-mono text-white/30 uppercase tracking-tighter">Blood_Group</span>
                <span className="text-xs font-black text-red-500">{patient.blood_type || 'N/A'}</span>
             </div>
             <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/5 shadow-inner">
                <UserIcon className="w-5 h-5 text-blue-500" />
             </div>
          </div>
        }
      />
      {/* 📊 SUB-METADATA BAR (DNI, DOB, COUNTRY) */}
      <div className="flex flex-wrap items-center gap-8 px-6 py-4 bg-black/40 border border-white/5 rounded-sm text-[10px] font-mono text-white/20 uppercase tracking-widest backdrop-blur-md">
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
      {/* 🛠️ MODULAR DATA ENGINE (TABS) */}
      <div className="border border-white/10 bg-black/20 backdrop-blur-md rounded-sm overflow-hidden shadow-2xl">
        <Tabs
          value={currentTab}
          onChange={setTab}
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
