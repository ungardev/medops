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
  BeakerIcon, 
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
        <div className="w-12 h-12 border-2 border-[var(--palantir-active)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--palantir-active)]">Syncing_Subject_Data...</p>
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
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-[var(--palantir-bg)] min-h-screen">
      
      {/* 🚀 ELITE_PAGE_HEADER: IDENTITY & TELEMETRY */}
      <PageHeader 
        title={patient.full_name}
        breadcrumb={`MEDOPS // DATABASE // SUBJECT_FILE // UID_${patient.id.toString().padStart(6, '0')}`}
        stats={[
          { 
            label: "Subject_Status", 
            value: patient.active ? "ACTIVE" : "INACTIVE",
            color: patient.active ? "text-emerald-500" : "text-red-500"
          },
          { 
            label: "System_Age", 
            value: `${patient.age || '--'} YRS`,
            color: "text-[var(--palantir-active)]"
          },
          { 
            label: "Weight_Metrics", 
            value: `${patient.weight || '--'} KG` 
          },
          { 
            label: "Height_Metrics", 
            value: `${patient.height || '--'} CM` 
          }
        ]}
        actions={
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end px-3 border-r border-[var(--palantir-border)]/50">
                <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase">Blood_Type</span>
                <span className="text-xs font-black text-red-500/80">{patient.blood_type || 'N/A'}</span>
             </div>
             <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--palantir-border)] bg-[var(--palantir-surface)]">
                <UserIcon className="w-5 h-5 text-[var(--palantir-active)]" />
             </div>
          </div>
        }
      />

      {/* 📊 SUB-METADATA BAR (DNI, DOB, COUNTRY) */}
      <div className="flex flex-wrap items-center gap-6 px-6 py-3 bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest shadow-inner">
        <span className="flex items-center gap-2">
          <IdentificationIcon className="w-3.5 h-3.5 text-[var(--palantir-active)]/50" />
          ID: <span className="text-[var(--palantir-text)]">{patient.national_id || "NOT_ASSIGNED"}</span>
        </span>
        <span className="flex items-center gap-2">
          <HeartIcon className="w-3.5 h-3.5 text-red-500/40" />
          DOB: <span className="text-[var(--palantir-text)]">{patient.birthdate ? new Date(patient.birthdate).toLocaleDateString("es-VE") : 'NOT_SET'}</span>
        </span>
        {patient.birth_country && (
          <span className="flex items-center gap-2">
            <GlobeAltIcon className="w-3.5 h-3.5 text-blue-500/40" />
            Origin: <span className="text-[var(--palantir-text)]">{patient.birth_country}</span>
          </span>
        )}
      </div>

      {/* 🛠️ MODULAR DATA ENGINE (TABS) */}
      <div className="border border-[var(--palantir-border)] bg-[var(--palantir-surface)] rounded-sm overflow-hidden shadow-2xl">
        <Tabs
          value={currentTab}
          onChange={setTab}
        >
          <Tab id="info" label="Identity">
            <PatientInfoTab patientId={patientId} />
          </Tab>

          <Tab id="consultas" label="Clinical_History">
            <PatientConsultationsTab patient={patient} />
          </Tab>

          <Tab id="documentos" label="Archives">
            <PatientDocumentsTab patient={patient} />
          </Tab>

          <Tab id="vacunacion" label="Immunology">
            <VaccinationTab patientId={patientId} onRefresh={() => {}} />
          </Tab>

          <Tab id="cirugias" label="Surgical">
            <SurgeriesTab patientId={patientId} onRefresh={() => {}} />
          </Tab>

          <Tab id="citas" label="Schedule">
            <PatientPendingAppointmentsTab patient={patient} />
          </Tab>

          <Tab id="pagos" label="Financial">
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
