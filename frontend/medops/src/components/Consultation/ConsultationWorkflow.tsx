import DiagnosisPanel from "./DiagnosisPanel";
import TreatmentPanel from "./TreatmentPanel";
import PrescriptionPanel from "./PrescriptionPanel";
import NotesPanel from "./NotesPanel";
import MedicalTestsPanel from "./MedicalTestsPanel";
import MedicalReferralsPanel from "./MedicalReferralsPanel";
import { Tabs, Tab } from "../ui/Tabs";
import { Diagnosis } from "../../types/consultation";
import { useCreateTreatment, useCreatePrescription } from "../../hooks/consultations";

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

  return (
    <Tabs
      defaultTab="diagnosis"
      className="
        space-y-3 sm:space-y-4 
        [&_.tab-label]:text-[#0d2c53] dark:[&_.tab-label]:text-white
        [&_.tab-label]:text-xs sm:[&_.tab-label]:text-sm md:[&_.tab-label]:text-base
        [&_.tab-label]:font-medium
      "
    >
      <Tab id="diagnosis" label="Diagnóstico">
        <DiagnosisPanel
          diagnoses={diagnoses}
          readOnly={readOnly}
          appointmentId={appointmentId}
        />
      </Tab>

      <Tab id="treatment" label="Tratamiento">
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
      </Tab>

      <Tab id="prescription" label="Prescripción">
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
      </Tab>

      <Tab id="notes" label="Notas">
        <NotesPanel appointmentId={appointmentId} notes={notes} readOnly={readOnly} />
      </Tab>

      <Tab id="tests" label="Exámenes Médicos">
        <MedicalTestsPanel appointmentId={appointmentId} readOnly={readOnly} />
      </Tab>

      <Tab id="referrals" label="Referencias Médicas">
        <MedicalReferralsPanel appointmentId={appointmentId} readOnly={readOnly} />
      </Tab>
    </Tabs>
  );
}
