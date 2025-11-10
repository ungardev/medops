// src/pages/Consultation/Consultation.tsx

import {
  PatientHeader,
  DiagnosisPanel,
  TreatmentPanel,
  PrescriptionPanel,
  NotesPanel,
  DocumentsPanel,
  ConsultationActions,
  ChargeOrderPanel,
} from "../../components/Consultation";

import {
  useCurrentConsultation,
  useCreateDiagnosis,
  useCreateTreatment,
  useCreatePrescription,
} from "../../hooks/consultations";

import { Tabs, Tab } from "../../components/ui/Tabs";
import { useGenerateMedicalReport } from "../../hooks/consultations/useGenerateMedicalReport"; // 👈 hook para generar informe
import { MedicalReportViewer } from "../../components/Consultation/MedicalReportViewer"; // 👈 nuevo componente viewer

export default function Consultation() {
  const { data: appointment, isLoading } = useCurrentConsultation();

  const createDiagnosis = useCreateDiagnosis();
  const createTreatment = useCreateTreatment();
  const createPrescription = useCreatePrescription();
  const generateReport = useGenerateMedicalReport(); // 👈 hook

  if (isLoading) return <p>Cargando consulta...</p>;
  if (!appointment) return <p>No hay paciente en consulta</p>;

  // 🔹 Condición exacta según tu models.py
  const canGenerateReport =
    appointment.status === "in_consultation" || appointment.status === "completed";

  return (
    <div className="consultation-page page">
      {/* 🔹 Panel superior: Identidad del paciente */}
      <PatientHeader patient={appointment.patient} />

      <div className="consultation-container">
        {/* 🔹 Columna izquierda: Documentos */}
        <div className="consultation-column">
          <div className="consultation-card">
            <DocumentsPanel patientId={appointment.patient.id} />
          </div>
        </div>

        {/* 🔹 Columna central: Tabs clínicos */}
        <div className="consultation-main">
          <div className="consultation-tabs">
            <Tabs defaultTab="diagnosis">
              <Tab id="diagnosis" label="Diagnóstico">
                <DiagnosisPanel
                  diagnoses={appointment.diagnoses}
                  onAdd={(data) =>
                    createDiagnosis.mutate({
                      appointment: appointment.id,
                      icd_code: data.icd_code,
                      title: data.title,
                      foundation_id: data.foundation_id,
                      description: data.description,
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
        </div>

        {/* 🔹 Columna derecha: Orden de Cobro + Pagos */}
        <div className="consultation-column">
          <div className="consultation-card">
            <ChargeOrderPanel appointmentId={appointment.id} />
          </div>
        </div>
      </div>

      {/* 🔹 Footer: acciones de cierre + informe médico */}
      <div className="consultation-footer flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between">
          <ConsultationActions consultationId={appointment.id} />

          {canGenerateReport && (
            <div>
              <button
                className="btn btn-primary"
                disabled={generateReport.isPending}
                onClick={() => generateReport.mutate(appointment.id)}
              >
                {generateReport.isPending ? "Generando..." : "Generar Informe Médico"}
              </button>

              {generateReport.data && (
                <a
                  href={generateReport.data.file_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary ml-2"
                >
                  Ver Informe Médico
                </a>
              )}
            </div>
          )}
        </div>

        {/* 🔹 Viewer inline del informe médico */}
        {generateReport.data && (
          <div className="consultation-report mt-4">
            <MedicalReportViewer report={generateReport.data} />
          </div>
        )}
      </div>
    </div>
  );
}
