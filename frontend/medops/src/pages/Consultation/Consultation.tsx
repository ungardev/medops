// src/pages/Consultation/Consultation.tsx
import {
  PatientHeader,
  DocumentsPanel,
  ConsultationActions,
  ChargeOrderPanel,
} from "../../components/Consultation";

import { useCurrentConsultation } from "../../hooks/consultations";
import { useGenerateMedicalReport } from "../../hooks/consultations/useGenerateMedicalReport";
import { useGenerateConsultationDocuments } from "../../hooks/consultations/useGenerateConsultationDocuments";
import ConsultationWorkflow from "../../components/Consultation/ConsultationWorkflow";

export default function Consultation() {
  // 🔹 Hooks siempre al inicio, sin condicionales
  const { data: appointment, isLoading } = useCurrentConsultation();
  const generateReport = useGenerateMedicalReport();
  const generateDocuments = useGenerateConsultationDocuments();

  // 🔹 Render defensivo
  if (isLoading) {
    return <p>Loading consultation...</p>;
  }
  if (!appointment) {
    return <p>No patient in consultation</p>;
  }

  const canGenerateReport =
    appointment.status === "in_consultation" || appointment.status === "completed";

  return (
    <div className="consultation-page page">
      {/* 🔹 Top panel: Patient identity */}
      <PatientHeader patient={appointment.patient} />

      <div className="consultation-container">
        {/* 🔹 Left column: Documents */}
        <div className="consultation-column">
          <div className="consultation-card">
            <DocumentsPanel
              patientId={appointment.patient.id}
              appointmentId={appointment.id}
            />
          </div>
        </div>

        {/* 🔹 Center column: Clinical workflow */}
        <div className="consultation-main">
          <div className="consultation-tabs">
            <ConsultationWorkflow
              diagnoses={appointment.diagnoses}
              appointmentId={appointment.id}
              notes={appointment.notes ?? null}
              readOnly={false}   // ✅ ahora se pasa explícitamente
            />
          </div>
        </div>

        {/* 🔹 Right column: Charge order + Payments */}
        <div className="consultation-column">
          <div className="consultation-card">
            <ChargeOrderPanel appointmentId={appointment.id} />
          </div>
        </div>
      </div>

      {/* 🔹 Footer: Action buttons */}
      <div className="consultation-footer flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between">
          <ConsultationActions consultationId={appointment.id} />

          {canGenerateReport && (
            <div className="flex items-center">
              {/* 🔹 Generate Medical Report */}
              <button
                className="btn btn-primary"
                disabled={generateReport.isPending}
                onClick={() => generateReport.mutate(appointment.id)}
              >
                {generateReport.isPending ? "Generating..." : "Generate Medical Report"}
              </button>

              {/* 🔹 View Medical Report */}
              {generateReport.data?.file_url && (
                <a
                  href={generateReport.data.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary ml-2"
                >
                  View Medical Report
                </a>
              )}

              {/* 🔹 Generate Consultation Documents */}
              <button
                className="btn btn-accent ml-2"
                disabled={generateDocuments.isPending}
                onClick={() => generateDocuments.mutate(appointment.id)}
              >
                {generateDocuments.isPending
                  ? "Generating..."
                  : "Generate Consultation Documents"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
