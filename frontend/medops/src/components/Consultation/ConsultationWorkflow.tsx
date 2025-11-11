import DiagnosisPanel from "./DiagnosisPanel";
import TreatmentPanel from "./TreatmentPanel";
import PrescriptionPanel from "./PrescriptionPanel";
import NotesPanel from "./NotesPanel";
import MedicalTestsPanel from "./MedicalTestsPanel";        // 👈 nuevo
import MedicalReferralsPanel from "./MedicalReferralsPanel"; // 👈 nuevo
import { Tabs, Tab } from "../ui/Tabs";
import { Diagnosis } from "../../types/consultation";

// 🔹 Hooks de creación para conectar directamente
import { useCreateTreatment, useCreatePrescription } from "../../hooks/consultations";

interface ConsultationWorkflowProps {
  diagnoses: Diagnosis[];
  appointmentId: number;
  notes: string | null;
}

export default function ConsultationWorkflow({
  diagnoses,
  appointmentId,
  notes,
}: ConsultationWorkflowProps) {
  const createTreatment = useCreateTreatment();
  const createPrescription = useCreatePrescription();

  return (
    <Tabs defaultTab="diagnosis" className="consultation-workflow">
      <Tab id="diagnosis" label="Diagnóstico">
        {/* DiagnosisPanel maneja internamente la creación con useCreateDiagnosis */}
        <DiagnosisPanel />
      </Tab>

      <Tab id="treatment" label="Tratamiento">
        <TreatmentPanel
          diagnoses={diagnoses}
          appointmentId={appointmentId}   // 👈 añadido para cumplir con TreatmentPanelProps
          onAdd={(data) =>
            createTreatment.mutate({
              ...data,
              appointment: appointmentId, // ✅ se pasa appointment al backend
            })
          }
        />
      </Tab>

      <Tab id="prescription" label="Prescripción">
        <PrescriptionPanel
          diagnoses={diagnoses}
          onAdd={(data) =>
            createPrescription.mutate({
              ...data, // 👈 solo diagnosis, medication, dosage, duration
            })
          }
        />
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
