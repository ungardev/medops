// src/pages/Diagnosis/Diagnosis.tsx
import { useState, useEffect } from "react";
import PageHeader from "@/components/Common/PageHeader";
import type { PatientRef } from "@/types/patients";
import PatientContextBanner from "./components/PatientContextBanner";
import DisclaimerBanner from "./components/DisclaimerBanner";
import DiagnosisCalculators from "./tabs/DiagnosisCalculators";
import DiagnosisPatient from "./tabs/DiagnosisPatient";
import { getPatient } from "@/api/patients";
import { Calculator, User } from "lucide-react";

const SESSION_KEY = "diagnosis_selected_patient";

export default function Diagnosis() {
  const [selectedPatient, setSelectedPatient] = useState<PatientRef | null>(null);
  const [patientData, setPatientData] = useState<{
    weight?: string | number | null;
    height?: string | number | null;
    birthdate?: string | null;
    gender?: string | null;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"calculators" | "patient">("calculators");
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
      icon: Calculator,
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
          { label: "Diagnóstico", active: true },
        ]}
      />

      <DisclaimerBanner />

      <PatientContextBanner
        selectedPatient={selectedPatient}
        onChange={handlePatientChange}
        error={patientError}
      />

      {!selectedPatient ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <div className="text-white/30 text-sm">
            Seleccione un paciente para acceder a las calculadoras médicas
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
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
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

          {activeTab === "patient" && <DiagnosisPatient patient={selectedPatient} />}
        </>
      )}
    </div>
  );
}
