import {
  PatientHeader,
  DocumentsPanel,
  ConsultationActions,
  ChargeOrderPanel,
} from "../../components/Consultation";

import { useCurrentConsultation } from "../../hooks/consultations";
import { useGenerateMedicalReport } from "../../hooks/consultations/useGenerateMedicalReport";
import { MedicalReportViewer } from "../../components/Consultation/MedicalReportViewer";

// 🔹 Importamos el workflow clínico completo
import ConsultationWorkflow from "../../components/Consultation/ConsultationWorkflow";

export default function Consultation() {
  const { data: appointment, isLoading } = useCurrentConsultation();
  const generateReport = useGenerateMedicalReport();

  if (isLoading) return <p>Cargando consulta...</p>;
  if (!appointment) return <p>No hay paciente en consulta</p>;

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

        {/* 🔹 Columna central: Workflow clínico completo */}
        <div className="consultation-main">
          <div className="consultation-tabs">
            <ConsultationWorkflow
              diagnoses={appointment.diagnoses}
              appointmentId={appointment.id}
              notes={appointment.notes}
            />
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
