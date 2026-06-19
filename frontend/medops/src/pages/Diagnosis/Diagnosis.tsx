// src/pages/Diagnosis/Diagnosis.tsx
import { useState, useEffect } from "react";
import PageHeader from "@/components/Common/PageHeader";
import type { PatientRef } from "@/types/patients";
import PatientContextBanner from "./components/PatientContextBanner";
import DisclaimerBanner from "./components/DisclaimerBanner";
import DiagnosisCalculators from "./tabs/DiagnosisCalculators";
import DiagnosisPatient from "./tabs/DiagnosisPatient";
import DiagnosisDocuments from "./tabs/DiagnosisDocuments";
import { getPatient } from "@/api/patients";
import { CpuChipIcon, BeakerIcon } from "@heroicons/react/24/outline";
import { Calculator as CalcIcon, User, FileText } from "lucide-react";

const SESSION_KEY = "diagnosis_selected_patient";

function StatBadge({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
}) {
  return (
    <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center min-w-[88px] hover:border-emerald-500/25 transition-colors">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-sm font-semibold text-emerald-400 tracking-tight">{value}</span>
      </div>
      <span className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 font-medium">
        {label}
      </span>
    </div>
  );
}

export default function Diagnosis() {
  const [selectedPatient, setSelectedPatient] = useState<PatientRef | null>(null);
  const [patientData, setPatientData] = useState<{
    weight?: string | number | null;
    height?: string | number | null;
    birthdate?: string | null;
    gender?: string | null;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"calculators" | "documents" | "patient">("calculators");
  const [patientError, setPatientError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PatientRef;
        setSelectedPatient(parsed);
        fetchPatientData(parsed.id);
      } catch {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const fetchPatientData = async (patientId: number) => {
    try {
      const full = await getPatient(patientId);
      setPatientData({
        weight: full.weight,
        height: full.height,
        birthdate: full.birthdate,
        gender: full.gender,
      });
    } catch {
      setPatientData(null);
    }
  };

  const handlePatientChange = (patient: PatientRef) => {
    setSelectedPatient(patient);
    setPatientError(null);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(patient));
    fetchPatientData(patient.id);
  };

  const tabs = [
    {
      id: "calculators" as const,
      label: "Calculadoras",
      icon: CalcIcon,
    },
    {
      id: "documents" as const,
      label: "Documentos",
      icon: FileText,
    },
    {
      id: "patient" as const,
      label: "Paciente",
      icon: User,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/doctor" },
          { label: "Diagnostico", active: true },
        ]}
      />

      <div className="bg-white/5 border border-white/15 rounded-xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex-1 flex items-start gap-3 min-w-0">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex-shrink-0">
              <CpuChipIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-white truncate">
                Centro de Diagnostico Inteligente
              </h1>
              <p className="text-sm text-white/50 mt-0.5">
                Calculadoras clinicas validadas + OCR con inteligencia artificial
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-stretch gap-2 border-l border-white/10 pl-6">
            <StatBadge icon={CalcIcon} value="22" label="calculadoras" />
            <StatBadge icon={CalcIcon} value="11" label="categorias" />
            <StatBadge icon={BeakerIcon} value="IA" label="Motor OCR" />
          </div>
        </div>

        <div className="flex md:hidden flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
          <StatBadge icon={CalcIcon} value="22" label="calculadoras" />
          <StatBadge icon={CalcIcon} value="11" label="categorias" />
          <StatBadge icon={BeakerIcon} value="IA" label="Motor OCR" />
        </div>
      </div>

      <DisclaimerBanner />

      <PatientContextBanner
        selectedPatient={selectedPatient}
        onChange={handlePatientChange}
        error={patientError}
      />

      {!selectedPatient ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <div className="text-white/30 text-sm">
            Seleccione un paciente para acceder a las calculadoras medicas
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "calculators" && (
            <DiagnosisCalculators
              patient={selectedPatient}
              patientData={patientData ?? undefined}
            />
          )}

          {activeTab === "documents" && <DiagnosisDocuments patient={selectedPatient} />}

          {activeTab === "patient" && <DiagnosisPatient patient={selectedPatient} />}
        </>
      )}
    </div>
  );
}
