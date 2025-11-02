// src/pages/Consultation/Consultation.tsx

import {
  PatientHeader,
  DiagnosisPanel,
  TreatmentPanel,
  PrescriptionPanel,
  NotesPanel,
  DocumentsPanel,
  PaymentsPanel,
  ConsultationActions,
} from "../../components/Consultation";

import {
  useCurrentConsultation,
  useCreateDiagnosis,
  useCreateTreatment,
  useCreatePrescription,
} from "../../hooks/consultations";

import { Tabs, Tab } from "../../components/ui/Tabs";

export default function Consultation() {
  const { data: appointment, isLoading } = useCurrentConsultation();

  const createDiagnosis = useCreateDiagnosis();
  const createTreatment = useCreateTreatment();
  const createPrescription = useCreatePrescription();

  if (isLoading) return <p>Cargando consulta...</p>;
  if (!appointment) return <p>No hay paciente en consulta</p>;

  return (
    <div className="consultation-page">
      {/* 🔹 Panel superior: Identidad del paciente */}
      <PatientHeader patient={appointment.patient} />

      <div className="consultation-body flex">
        {/* 🔹 Tabs clínicos */}
        <div className="consultation-main flex-1">
          <Tabs defaultTab="diagnosis">
            <Tab id="diagnosis" label="Diagnóstico">
              <DiagnosisPanel
                diagnoses={appointment.diagnoses}
                onAdd={(data) =>
                  createDiagnosis.mutate({
                    ...data,
                    appointment: appointment.id,
                  })
                }
              />
            </Tab>

            <Tab id="treatment" label="Tratamiento">
              <TreatmentPanel
                diagnoses={appointment.diagnoses}
                onAdd={(data) => createTreatment.mutate({ ...data })}
              />
            </Tab>

            <Tab id="prescription" label="Prescripción">
              <PrescriptionPanel
                diagnoses={appointment.diagnoses}
                onAdd={(data) => createPrescription.mutate({ ...data })}
              />
            </Tab>

            <Tab id="notes" label="Notas">
              <NotesPanel
                consultationId={appointment.id}
                notes={appointment.notes}
              />
            </Tab>
          </Tabs>
        </div>

        {/* 🔹 Side-panels */}
        <aside className="consultation-side w-1/3">
          <DocumentsPanel patientId={appointment.patient.id} />
          <PaymentsPanel appointmentId={appointment.id} />
        </aside>
      </div>

      {/* 🔹 Footer: acciones de cierre */}
      <ConsultationActions consultationId={appointment.id} />
    </div>
  );
}
