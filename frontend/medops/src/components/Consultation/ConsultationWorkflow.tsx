// src/components/Consultation/ConsultationWorkflow.tsx
import { useState } from "react";
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
interface ConsultationWorkflowProps {
  diagnoses: Diagnosis[];
  appointmentId: number;
  treatments?: Treatment[];
  readOnly: boolean;
}
export default function ConsultationWorkflow({
  diagnoses,
  appointmentId,
  treatments,
  readOnly,
}: ConsultationWorkflowProps) {
  const createTreatment = useCreateTreatment();
  const createPrescription = useCreatePrescription();
  const [activeTab, setActiveTab] = useState("vital-signs");
  
  const tabIcons = {
    "vital-signs": <HeartIcon className="w-4 h-4" />,
    "clinical-note": <DocumentTextIcon className="w-4 h-4" />,
    diagnosis: <BeakerIcon className="w-4 h-4" />,
    treatment: <ClipboardDocumentCheckIcon className="w-4 h-4" />,
    prescription: <PencilSquareIcon className="w-4 h-4" />,
    tests: <QueueListIcon className="w-4 h-4" />,
    referrals: <ArrowRightCircleIcon className="w-4 h-4" />,
  };
  const handleCreateTreatment = async (data: {
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
  };
  return (
    <div className="w-full space-y-6">
      {readOnly && (
        <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <BuildingOfficeIcon className="w-5 h-5 text-red-400" />
            <div>
              <h4 className="text-sm font-semibold text-red-300">Read-Only Mode</h4>
              <p className="text-xs text-red-400/80">
                Cross-institution access detected. You can only view this consultation.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        layout="horizontal"
        className="w-full space-y-6"
      >
        <Tab 
          id="vital-signs" 
          label={<span className="flex items-center gap-2">{tabIcons["vital-signs"]} Vital Signs</span>}
        >
          <div className="w-full">
            <VitalSignsPanel appointmentId={appointmentId} readOnly={readOnly} />
          </div>
        </Tab>
        
        <Tab 
          id="clinical-note" 
          label={<span className="flex items-center gap-2">{tabIcons["clinical-note"]} Clinical Note</span>}
        >
          <div className="w-full">
            <ClinicalNotePanel appointmentId={appointmentId} readOnly={readOnly} />
          </div>
        </Tab>
        
        <Tab 
          id="diagnosis" 
          label={<span className="flex items-center gap-2">{tabIcons.diagnosis} Diagnosis</span>}
        >
          <div className="w-full">
            <DiagnosisPanel 
              diagnoses={diagnoses} 
              readOnly={readOnly} 
              appointmentId={appointmentId}
            />
          </div>
        </Tab>
        
        <Tab 
          id="treatment" 
          label={<span className="flex items-center gap-2">{tabIcons.treatment} Treatment</span>}
        >
          <div className="w-full">
            <TreatmentPanel 
              diagnoses={diagnoses}
              appointmentId={appointmentId} 
              treatments={treatments}
              readOnly={readOnly}
              onAdd={handleCreateTreatment}
            />
          </div>
        </Tab>
        
        <Tab 
          id="prescription" 
          label={<span className="flex items-center gap-2">{tabIcons.prescription} Prescription</span>}
        >
          <div className="w-full">
            <PrescriptionPanel 
              diagnoses={diagnoses}
              appointmentId={appointmentId} 
              readOnly={readOnly}
              onAdd={(data: CreatePrescriptionInput) => createPrescription.mutateAsync(data)}
            />
          </div>
        </Tab>
        
        <Tab 
          id="tests" 
          label={<span className="flex items-center gap-2">{tabIcons.tests} Tests</span>}
        >
          <div className="w-full">
            <MedicalTestsPanel appointmentId={appointmentId} readOnly={readOnly} />
          </div>
        </Tab>
        
        <Tab 
          id="referrals" 
          label={<span className="flex items-center gap-2">{tabIcons.referrals} Referrals</span>}
        >
          <div className="w-full">
            <MedicalReferralsPanel appointmentId={appointmentId} readOnly={readOnly} />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}