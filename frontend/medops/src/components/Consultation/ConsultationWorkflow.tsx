// src/components/Consultation/ConsultationWorkflow.tsx
import DiagnosisPanel from "./DiagnosisPanel";
import TreatmentPanel from "./TreatmentPanel";
import PrescriptionPanel from "./PrescriptionPanel";
import NotesPanel from "./NotesPanel";
import MedicalTestsPanel from "./MedicalTestsPanel";        // 👈 nuevo
import MedicalReferralsPanel from "./MedicalReferralsPanel"; // 👈 nuevo
import { Tabs, Tab } from "../ui/Tabs";
import { Diagnosis } from "../../types/consultation";

interface ConsultationWorkflowProps {
  diagnoses: Diagnosis[];
  onAddTreatment: (data: {
    diagnosis: number;
    plan: string;
    start_date?: string;
    end_date?: string;
  }) => void;
  onAddPrescription: (data: {
    diagnosis: number;
    medication: string;
    dosage?: string;
    duration?: string;
  }) => void;
  appointmentId: number;
  notes: string | null;
}

export default function ConsultationWorkflow({
  diagnoses,
  onAddTreatment,
  onAddPrescription,
  appointmentId,
  notes,
}: ConsultationWorkflowProps) {
  return (
    <Tabs defaultTab="diagnosis" className="consultation-workflow">
      <Tab id="diagnosis" label="Diagnóstico">
        {/* DiagnosisPanel maneja internamente la creación con useCreateDiagnosis */}
        <DiagnosisPanel />
      </Tab>

      <Tab id="treatment" label="Tratamiento">
        <TreatmentPanel diagnoses={diagnoses} onAdd={onAddTreatment} />
      </Tab>

      <Tab id="prescription" label="Prescripción">
        <PrescriptionPanel diagnoses={diagnoses} onAdd={onAddPrescription} />
      </Tab>

      <Tab id="notes" label="Notas">
        {/* NotesPanel maneja internamente la edición con useUpdateAppointmentNotes */}
        <NotesPanel appointmentId={appointmentId} notes={notes} />
      </Tab>

      <Tab id="tests" label="Exámenes Médicos">
        {/* MedicalTestsPanel maneja internamente la creación con useCreateMedicalTest */}
        <MedicalTestsPanel appointmentId={appointmentId} />
      </Tab>

      <Tab id="referrals" label="Referencias Médicas">
        {/* MedicalReferralsPanel maneja internamente la creación con useCreateMedicalReferral */}
        <MedicalReferralsPanel appointmentId={appointmentId} />
      </Tab>
    </Tabs>
  );
}
