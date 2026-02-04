// src/components/Consultation/ConsultationWorkflow.tsx
import { useState } from "react";
import DiagnosisPanel from "./DiagnosisPanel";
import TreatmentPanel from "./TreatmentPanel";
import PrescriptionPanel from "./PrescriptionPanel";
import MedicalTestsPanel from "./MedicalTestsPanel";
import MedicalReferralsPanel from "./MedicalReferralsPanel";
// 🆕 IMPORTAR NUEVOS COMPONENTES
import VitalSignsPanel from "./VitalSignsPanel";
import ClinicalNotePanel from "./ClinicalNotePanel";
import { Tabs, Tab } from "../ui/Tabs";
import { Diagnosis } from "../../types/consultation";
import { useCreateTreatment, useCreatePrescription } from "../../hooks/consultations";
import type { CreatePrescriptionInput } from "../../types/consultation";
import { 
  BeakerIcon, 
  ClipboardDocumentCheckIcon, 
  PencilSquareIcon, 
  QueueListIcon, 
  ShieldCheckIcon,
  ArrowRightCircleIcon,
  HeartIcon, // 🆕 ICONO VITAL SIGNS
  DocumentTextIcon, // 🆕 ICONO CLINICAL NOTE
  BuildingOfficeIcon // 🆕 ICONO INSTITUCIONAL
} from "@heroicons/react/24/outline";
// 🔥 CORRECCIÓN CRÍTICA: Interface sin parámetro obsoleto
interface ConsultationWorkflowProps {
  diagnoses: Diagnosis[];
  appointmentId: number;
  readOnly: boolean;
  // ❌ ELIMINADO: notes?: string | null; (parámetro obsoleto que causaba el error)
}
export default function ConsultationWorkflow({
  diagnoses,
  appointmentId,
  readOnly,
}: ConsultationWorkflowProps) {
  const createTreatment = useCreateTreatment();
  const createPrescription = useCreatePrescription();
  const [activeTab, setActiveTab] = useState("vital-signs"); // 🆕 EMPEZAR CON VITAL SIGNS
  
  // 🆕 OBJETO DE ÍCONOS CONSISTENTE
  const tabIcons = {
    "vital-signs": <HeartIcon className="w-4 h-4" />,
    "clinical-note": <DocumentTextIcon className="w-4 h-4" />,
    diagnosis: <BeakerIcon className="w-4 h-4" />,
    treatment: <ClipboardDocumentCheckIcon className="w-4 h-4" />,
    prescription: <PencilSquareIcon className="w-4 h-4" />,
    tests: <QueueListIcon className="w-4 h-4" />,
    referrals: <ArrowRightCircleIcon className="w-4 h-4" />,
  };
  return (
    <div className="w-full space-y-6">
      {/* 🆕 BANNER DE INSTITUCIÓN - MEJORADO VISUALMENTE */}
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
      
      {/* 🆕 SISTEMA DE TABS MEJORADO - FIJADO EL RENDERIZADO */}
      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        layout="horizontal"
        className="w-full space-y-6"
      >
        {/* 🆕 TAB: VITAL SIGNS */}
        <Tab 
          id="vital-signs" 
          label={<span className="flex items-center gap-2">{tabIcons["vital-signs"]} Vital Signs</span>}
        >
          <div className="w-full">
            <VitalSignsPanel appointmentId={appointmentId} readOnly={readOnly} />
          </div>
        </Tab>
        {/* 🆕 TAB: CLINICAL NOTE */}
        <Tab 
          id="clinical-note" 
          label={<span className="flex items-center gap-2">{tabIcons["clinical-note"]} Clinical Note</span>}
        >
          <div className="w-full">
            <ClinicalNotePanel appointmentId={appointmentId} readOnly={readOnly} />
          </div>
        </Tab>
        {/* TAB: DIAGNOSIS */}
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
        {/* TAB: TREATMENT */}
        <Tab 
          id="treatment" 
          label={<span className="flex items-center gap-2">{tabIcons.treatment} Treatment</span>}
        >
          <div className="w-full">
            <TreatmentPanel 
              diagnoses={diagnoses}
              appointmentId={appointmentId} 
              readOnly={readOnly}
              onAdd={(data) => createTreatment.mutateAsync({
                appointment: appointmentId,
                diagnosis: data.diagnosis,
                title: `Tratamiento para ${data.diagnosis}`,
                plan: data.plan,
                treatment_type: data.treatment_type,
                start_date: data.start_date,
                end_date: data.end_date,
                status: data.status
              })}
            />
          </div>
        </Tab>
        {/* TAB: PRESCRIPTION */}
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
        {/* TAB: TESTS */}
        <Tab 
          id="tests" 
          label={<span className="flex items-center gap-2">{tabIcons.tests} Tests</span>}
        >
          <div className="w-full">
            <MedicalTestsPanel appointmentId={appointmentId} readOnly={readOnly} />
          </div>
        </Tab>
        {/* TAB: REFERRALS */}
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