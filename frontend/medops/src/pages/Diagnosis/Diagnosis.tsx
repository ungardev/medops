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
import { Calculator, User, FileText, CpuChipIcon, BeakerIcon } from "@heroicons/react/24/outline";
import { Calculator as CalcIcon } from "lucide-react";

const SESSION_KEY = "diagnosis_selected_patient";

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

      <div className="bg-white/5 border border-white/15 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <CpuChipIcon className="w-5 h-5 text-emerald-400" />
              </div>
              Centro de Diagnostico Inteligente
            </h1>
            <p className="text-sm text-white/50 mt-1 ml-11">
              Calculadoras clinicas validadas + OCR con inteligencia artificial
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 ml-11 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-emerald-400/60" />
            22 calculadoras
          </span>
          <span className="text-white/20">|</span>
          <span className="flex items-center gap-1.5">
            <CalcIcon className="w-3.5 h-3.5 text-emerald-400/60" />
            11 categorias
          </span>
          <span className="text-white/20">|</span>
          <span className="flex items-center gap-1.5">
            <BeakerIcon className="w-3.5 h-3.5 text-emerald-400/60" />
            Motor OCR con IA
          </span>
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
