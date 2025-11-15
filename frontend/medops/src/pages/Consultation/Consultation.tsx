// src/pages/Consultation/Consultation.tsx
import {
  PatientHeader,
  DocumentsPanel,
  ConsultationActions,
  ChargeOrderPanel,
} from "../../components/Consultation";

import { useCurrentConsultation } from "../../hooks/consultations";
import { useGenerateMedicalReport } from "../../hooks/consultations/useGenerateMedicalReport";
import { MedicalReportViewer } from "../../components/Consultation/MedicalReportViewer";

// 🔹 Import full clinical workflow
import ConsultationWorkflow from "../../components/Consultation/ConsultationWorkflow";

// 🔹 New hook for generating consultation documents
import { useGenerateConsultationDocuments } from "../../hooks/consultations/useGenerateConsultationDocuments";

// 🔹 Types
import type { MedicalReport } from "../../types/medicalReport";

export default function Consultation() {
  const { data: appointment, isLoading } = useCurrentConsultation();
  const generateReport = useGenerateMedicalReport();
  const generateDocuments = useGenerateConsultationDocuments();

  if (isLoading) return <p>Loading consultation...</p>;
  if (!appointment) return <p>No patient in consultation</p>;

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
            <DocumentsPanel patientId={appointment.patient.id} />
          </div>
        </div>

        {/* 🔹 Center column: Full clinical workflow */}
        <div className="consultation-main">
          <div className="consultation-tabs">
            <ConsultationWorkflow
              diagnoses={appointment.diagnoses}
              appointmentId={appointment.id}
              notes={appointment.notes}
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

      {/* 🔹 Footer: closing actions + medical report + consultation documents */}
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

              {generateReport.data && (
                <a
                  href={generateReport.data.file_url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary ml-2"
                >
                  View Medical Report
                </a>
              )}

              {/* 🔹 Generate Consultation Documents (excluye Medical Report) */}
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

        {/* 🔹 Inline viewer for medical report */}
        {generateReport.data && (
          <div className="consultation-report mt-4">
            <MedicalReportViewer report={generateReport.data as MedicalReport} />
          </div>
        )}

        {/* 🔹 Feedback for consultation documents */}
        {generateDocuments.data && (
          <div className="consultation-documents mt-4">
            <p className="text-sm text-gray-700 font-semibold">Generated Documents:</p>
            <ul className="list-disc ml-6 text-sm text-gray-700">
              {generateDocuments.data.generated.length > 0 ? (
                generateDocuments.data.generated.map((doc) => (
                  <li key={doc.id}>
                    <span className="font-medium">{doc.category}</span>: {doc.description}{" "}
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline ml-1"
                    >
                      View
                    </a>
                  </li>
                ))
              ) : (
                <li>None</li>
              )}
            </ul>

            <p className="text-sm text-gray-500 mt-2 font-semibold">Skipped:</p>
            <ul className="list-disc ml-6 text-sm text-gray-500">
              {generateDocuments.data.skipped.length > 0 ? (
                generateDocuments.data.skipped.map((s, idx) => <li key={idx}>{s}</li>)
              ) : (
                <li>None</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
