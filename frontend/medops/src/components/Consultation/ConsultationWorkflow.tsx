// src/components/Consultation/ConsultationWorkflow.tsx
import { useState } from "react";
import DiagnosisPanel from "./DiagnosisPanel";
import TreatmentPanel from "./TreatmentPanel";
import PrescriptionPanel from "./PrescriptionPanel";
import NotesPanel from "./NotesPanel";
import MedicalTestsPanel from "./MedicalTestsPanel";
import MedicalReferralsPanel from "./MedicalReferralsPanel";
import { Tabs, Tab } from "../ui/Tabs";
import { Diagnosis } from "../../types/consultation";
import { useCreateTreatment, useCreatePrescription } from "../../hooks/consultations";
import { 
  BeakerIcon, 
  ClipboardDocumentCheckIcon, 
  PencilSquareIcon, 
  QueueListIcon, 
  ShieldCheckIcon,
  ArrowRightCircleIcon
} from "@heroicons/react/24/outline";

interface ConsultationWorkflowProps {
  diagnoses: Diagnosis[];
  appointmentId: number;
  notes: string | null;
  readOnly: boolean;
}

export default function ConsultationWorkflow({
  diagnoses,
  appointmentId,
  notes,
  readOnly,
}: ConsultationWorkflowProps) {
  const createTreatment = useCreateTreatment();
  const createPrescription = useCreatePrescription();
  const [activeTab, setActiveTab] = useState("diagnosis");

  // Mapeo de iconos para las pestañas
  const tabIcons: Record<string, any> = {
    diagnosis: <ShieldCheckIcon className="w-4 h-4" />,
    treatment: <QueueListIcon className="w-4 h-4" />,
    prescription: <PencilSquareIcon className="w-4 h-4" />,
    notes: <ClipboardDocumentCheckIcon className="w-4 h-4" />,
    tests: <BeakerIcon className="w-4 h-4" />,
    referrals: <ArrowRightCircleIcon className="w-4 h-4" />
  };

  return (
    <div className="bg-black/20 border border-[var(--palantir-border)] min-h-[600px] flex flex-col">
      {/* Barra de progreso / Info de sesión */}
      <div className="bg-[var(--palantir-border)]/10 px-4 py-2 flex justify-between items-center border-b border-[var(--palantir-border)]">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--palantir-active)]">
          Clinical_Workflow_Engine // Session_ID: {appointmentId}
        </span>
        <div className="flex gap-1">
          {['diagnosis', 'treatment', 'prescription'].map((step) => (
            <div 
              key={step}
              className={`w-2 h-2 rounded-full ${activeTab === step ? 'bg-[var(--palantir-active)] animate-pulse' : 'bg-[var(--palantir-border)]'}`}
            />
          ))}
        </div>
      </div>

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        className="flex-1 flex flex-col
          [&_nav]:bg-black/40 [&_nav]:border-b [&_nav]:border-[var(--palantir-border)]
          [&_.tab-list]:flex [&_.tab-list]:overflow-x-auto [&_.tab-list]:scrollbar-none
          [&_.tab-label]:px-6 [&_.tab-label]:py-4 [&_.tab-label]:flex [&_.tab-label]:items-center [&_.tab-label]:gap-3
          [&_.tab-label]:text-[10px] [&_.tab-label]:font-black [&_.tab-label]:uppercase [&_.tab-label]:tracking-widest
          [&_.tab-label]:transition-all [&_.tab-label]:relative
          [&_.tab-label]:text-[var(--palantir-muted)]
          [&_.active-tab]:text-[var(--palantir-active)] [&_.active-tab]:bg-white/5
          [&_.active-tab]:after:content-[''] [&_.active-tab]:after:absolute [&_.active-tab]:after:bottom-0 [&_.active-tab]:after:left-0 [&_.active-tab]:after:w-full [&_.active-tab]:after:h-0.5 [&_.active-tab]:after:bg-[var(--palantir-active)]
        "
      >
        <Tab 
          id="diagnosis" 
          label={<span className="flex items-center gap-2">{tabIcons.diagnosis} Diagnóstico</span>}
        >
          <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <DiagnosisPanel
              diagnoses={diagnoses}
              readOnly={readOnly}
              appointmentId={appointmentId}
            />
          </div>
        </Tab>

        <Tab 
          id="treatment" 
          label={<span className="flex items-center gap-2">{tabIcons.treatment} Tratamiento</span>}
        >
          <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TreatmentPanel
              diagnoses={diagnoses}
              appointmentId={appointmentId}
              readOnly={readOnly}
              onAdd={
                !readOnly
                  ? (data) =>
                      createTreatment.mutate({
                        ...data,
                        appointment: appointmentId,
                      })
                  : undefined
              }
            />
          </div>
        </Tab>

        <Tab 
          id="prescription" 
          label={<span className="flex items-center gap-2">{tabIcons.prescription} Prescripción</span>}
        >
          <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <PrescriptionPanel
              diagnoses={diagnoses}
              readOnly={readOnly}
              onAdd={
                !readOnly
                  ? (data) =>
                      createPrescription.mutate({
                        ...data,
                      })
                  : undefined
              }
            />
          </div>
        </Tab>

        <Tab 
          id="notes" 
          label={<span className="flex items-center gap-2">{tabIcons.notes} Notas</span>}
        >
          <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <NotesPanel appointmentId={appointmentId} notes={notes} readOnly={readOnly} />
          </div>
        </Tab>

        <Tab 
          id="tests" 
          label={<span className="flex items-center gap-2">{tabIcons.tests} Exámenes</span>}
        >
          <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <MedicalTestsPanel appointmentId={appointmentId} readOnly={readOnly} />
          </div>
        </Tab>

        <Tab 
          id="referrals" 
          label={<span className="flex items-center gap-2">{tabIcons.referrals} Referencias</span>}
        >
          <div className="p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <MedicalReferralsPanel appointmentId={appointmentId} readOnly={readOnly} />
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
