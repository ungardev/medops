// src/components/Consultation/ConsultationWorkflow.tsx
import { useState, useMemo, memo, useCallback } from "react";
import DiagnosisPanel from "./DiagnosisPanel";
import TreatmentPanel from "./TreatmentPanel";
import PrescriptionPanel from "./PrescriptionPanel";
import MedicalTestsPanel from "./MedicalTestsPanel";
import MedicalReferralsPanel from "./MedicalReferralsPanel";
import VitalSignsPanel from "./VitalSignsPanel";
import ClinicalNotePanel from "./ClinicalNotePanel";
import { Tabs, Tab } from "../ui/Tabs";
import { Diagnosis, Treatment } from "../../types/consultation";
import { useCreateTreatment, useCreatePrescription } from "../../hooks/consultations";
import type { CreatePrescriptionInput } from "../../types/consultation";
import { 
  BeakerIcon, 
  ClipboardDocumentCheckIcon, 
  PencilSquareIcon, 
  QueueListIcon, 
  ShieldCheckIcon,
  ArrowRightCircleIcon,
  HeartIcon,
  DocumentTextIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";

type TabId = "vital-signs" | "clinical-note" | "diagnosis" | "treatment" | "prescription" | "tests" | "referrals";

interface ConsultationWorkflowProps {
  diagnoses: Diagnosis[];
  appointmentId: number;
  treatments?: Treatment[];
  readOnly: boolean;
}

const tabConfig: Record<TabId, { icon: React.ReactNode; label: string }> = {
  "vital-signs": { icon: <HeartIcon className="w-5 h-5" />, label: "Signos Vitales" },
  "clinical-note": { icon: <DocumentTextIcon className="w-5 h-5" />, label: "Nota Clínica" },
  diagnosis: { icon: <BeakerIcon className="w-5 h-5" />, label: "Diagnóstico" },
  treatment: { icon: <ClipboardDocumentCheckIcon className="w-5 h-5" />, label: "Tratamiento" },
  prescription: { icon: <PencilSquareIcon className="w-5 h-5" />, label: "Receta" },
  tests: { icon: <QueueListIcon className="w-5 h-5" />, label: "Exámenes" },
  referrals: { icon: <ArrowRightCircleIcon className="w-5 h-5" />, label: "Referencias" },
};

const MemoizedVitalSignsPanel = memo(VitalSignsPanel);
const MemoizedClinicalNotePanel = memo(ClinicalNotePanel);
const MemoizedDiagnosisPanel = memo(DiagnosisPanel);
const MemoizedTreatmentPanel = memo(TreatmentPanel);
const MemoizedPrescriptionPanel = memo(PrescriptionPanel);
const MemoizedMedicalTestsPanel = memo(MedicalTestsPanel);
const MemoizedMedicalReferralsPanel = memo(MedicalReferralsPanel);

export default function ConsultationWorkflow({
  diagnoses,
  appointmentId,
  treatments,
  readOnly,
}: ConsultationWorkflowProps) {
  const createTreatment = useCreateTreatment();
  const createPrescription = useCreatePrescription();
  const [activeTab, setActiveTab] = useState<TabId>("vital-signs");

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId as TabId);
  }, []);

  const tabIcons = useMemo(() => ({
    "vital-signs": tabConfig["vital-signs"].icon,
    "clinical-note": tabConfig["clinical-note"].icon,
    diagnosis: tabConfig.diagnosis.icon,
    treatment: tabConfig.treatment.icon,
    prescription: tabConfig.prescription.icon,
    tests: tabConfig.tests.icon,
    referrals: tabConfig.referrals.icon,
  }), []);

  const handleCreateTreatment = useCallback(async (data: {
    appointment: number;
    diagnosis: number;
    plan: string;
    start_date?: string;
    end_date?: string;
    status: "active" | "completed" | "cancelled";
    treatment_type: "pharmacological" | "surgical" | "rehabilitation" | "lifestyle" | "other";
  }) => {
    const selectedDiagnosis = diagnoses.find(d => d.id === data.diagnosis);
    const diagnosisTitle = selectedDiagnosis 
      ? selectedDiagnosis.title || selectedDiagnosis.icd_code 
      : `Diagnóstico #${data.diagnosis}`;
    
    try {
      await createTreatment.mutateAsync({
        appointment: appointmentId,
        diagnosis: data.diagnosis,
        title: `Tratamiento: ${diagnosisTitle}`,
        plan: data.plan,
        treatment_type: data.treatment_type,
        start_date: data.start_date,
        end_date: data.end_date,
        status: data.status
      });
    } catch (error) {
      console.error("Error creando tratamiento:", error);
      alert("Error al crear tratamiento. Por favor intenta de nuevo.");
    }
  }, [createTreatment, diagnoses, appointmentId]);

  const renderTabContent = useCallback((tabId: TabId) => {
    const key = `panel-${tabId}`;
    
    switch (tabId) {
      case "vital-signs":
        return (
          <MemoizedVitalSignsPanel 
            key={key}
            appointmentId={appointmentId} 
            readOnly={readOnly} 
          />
        );
      case "clinical-note":
        return (
          <MemoizedClinicalNotePanel 
            key={key}
            appointmentId={appointmentId} 
            readOnly={readOnly} 
          />
        );
      case "diagnosis":
        return (
          <MemoizedDiagnosisPanel 
            key={key}
            diagnoses={diagnoses} 
            readOnly={readOnly} 
            appointmentId={appointmentId}
          />
        );
      case "treatment":
        return (
          <MemoizedTreatmentPanel 
            key={key}
            diagnoses={diagnoses}
            appointmentId={appointmentId} 
            treatments={treatments}
            readOnly={readOnly}
            onAdd={handleCreateTreatment}
          />
        );
      case "prescription":
        return (
          <MemoizedPrescriptionPanel 
            key={key}
            diagnoses={diagnoses}
            appointmentId={appointmentId} 
            readOnly={readOnly}
            onAdd={(data: CreatePrescriptionInput) => createPrescription.mutateAsync(data)}
          />
        );
      case "tests":
        return (
          <MemoizedMedicalTestsPanel 
            key={key}
            appointmentId={appointmentId} 
            readOnly={readOnly} 
          />
        );
      case "referrals":
        return (
          <MemoizedMedicalReferralsPanel 
            key={key}
            appointmentId={appointmentId} 
            diagnoses={diagnoses}
            readOnly={readOnly} 
          />
        );
      default:
        return null;
    }
  }, [appointmentId, readOnly, diagnoses, treatments, handleCreateTreatment, createPrescription]);

  return (
    <div className="w-full space-y-6">
      {readOnly && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <BuildingOfficeIcon className="w-5 h-5 text-red-400" />
            <div>
              <h4 className="text-[12px] font-bold text-red-400">Solo Lectura</h4>
              <p className="text-[11px] text-red-400/80">
                Acceso desde otra institución. Solo puedes ver esta consulta.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        layout="horizontal"
        className="w-full space-y-6"
      >
        {(Object.keys(tabConfig) as TabId[]).map(tabId => (
          <Tab 
            key={tabId}
            id={tabId} 
            label={
              <span className="flex items-center gap-2 text-sm font-medium">
                {tabIcons[tabId]} {tabConfig[tabId].label}
              </span>
            }
          >
            <div className="w-full">
              {renderTabContent(tabId)}
            </div>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}