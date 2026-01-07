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

// Iconos para el Header
import { 
  IdentificationIcon, 
  HeartIcon, 
  BeakerIcon, 
  GlobeAltIcon, 
  ChevronRightIcon 
} from "@heroicons/react/24/solid";

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
    <div className="max-w-[1400px] mx-auto p-4 lg:p-6 space-y-6">
      
      {/* 🚀 PATIENT IDENTITY HEADER */}
      <header className="relative overflow-hidden bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm p-6 shadow-2xl">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(var(--palantir-active) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
        
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            {/* Status & ID Badge */}
            <div className="flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full animate-pulse ${patient.active ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
              <span className="text-[10px] font-mono text-[var(--palantir-active)] uppercase tracking-widest">
                {patient.active ? 'Subject_Active' : 'Subject_Inactive'} // UID_{patient.id.toString().padStart(6, '0')}
              </span>
            </div>

            {/* Main Identity */}
            <h1 className="text-2xl md:text-4xl font-black text-[var(--palantir-text)] uppercase tracking-tight leading-none">
              {patient.full_name}
            </h1>

            {/* Vital Metadata Grid */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-mono text-[var(--palantir-muted)] uppercase">
              <span className="flex items-center gap-1.5">
                <IdentificationIcon className="w-4 h-4 text-[var(--palantir-active)]" />
                {patient.national_id || "NO_ID_RECORDED"}
              </span>
              <span className="flex items-center gap-1.5">
                <HeartIcon className="w-4 h-4 text-red-500/70" />
                D.O.B: {patient.birthdate ? new Date(patient.birthdate).toLocaleDateString("es-VE") : 'NOT_SET'}
              </span>
              <span className="flex items-center gap-1.5">
                <BeakerIcon className="w-4 h-4 text-blue-500/70" />
                Type: {patient.blood_type || '--'}
              </span>
              {patient.birth_country && (
                <span className="flex items-center gap-1.5 opacity-80">
                  <GlobeAltIcon className="w-4 h-4" />
                  {patient.birth_country}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats Telemetry */}
          <div className="flex gap-2">
             <div className="px-4 py-2 border border-[var(--palantir-border)] bg-black/20 rounded-sm min-w-[90px] text-center">
                <p className="text-[8px] text-[var(--palantir-muted)] uppercase font-black mb-1">Weight</p>
                <p className="text-[14px] font-mono font-bold text-[var(--palantir-text)]">
                  {patient.weight || '--'} <span className="text-[9px] text-[var(--palantir-active)]">KG</span>
                </p>
             </div>
             <div className="px-4 py-2 border border-[var(--palantir-border)] bg-black/20 rounded-sm min-w-[90px] text-center">
                <p className="text-[8px] text-[var(--palantir-muted)] uppercase font-black mb-1">Height</p>
                <p className="text-[14px] font-mono font-bold text-[var(--palantir-text)]">
                  {patient.height || '--'} <span className="text-[9px] text-[var(--palantir-active)]">CM</span>
                </p>
             </div>
             <div className="hidden lg:flex px-4 py-2 border border-[var(--palantir-border)] bg-[var(--palantir-active)]/10 rounded-sm items-center gap-3 group cursor-pointer">
                <div className="text-right">
                  <p className="text-[8px] text-[var(--palantir-active)] uppercase font-black">System_Age</p>
                  <p className="text-[14px] font-mono font-bold text-[var(--palantir-text)]">{patient.age || '--'}Y</p>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-[var(--palantir-active)] group-hover:translate-x-1 transition-transform" />
             </div>
          </div>
        </div>
      </header>

      {/* 🛠️ MODULAR DATA ENGINE (TABS) */}
      <div className="bg-transparent">
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
