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
import Toast from "../../components/Common/Toast";
import { useState } from "react";

export default function Consultation() {
  const { data: appointment, isLoading } = useCurrentConsultation();
  const generateReport = useGenerateMedicalReport();
  const generateDocuments = useGenerateConsultationDocuments();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  if (isLoading) return <p className="text-gray-500">Cargando consulta...</p>;
  if (!appointment) return <p className="text-red-600">No hay paciente en consulta</p>;

  const canGenerateReport =
    appointment.status === "in_consultation" || appointment.status === "completed";

  const handleGenerateReport = async () => {
    try {
      await generateReport.mutateAsync(appointment.id);
      setToast({ message: "Informe médico generado correctamente", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Error al generar informe médico", type: "error" });
    }
  };

  const handleGenerateDocuments = async () => {
    try {
      await generateDocuments.mutateAsync(appointment.id);
      setToast({ message: "Documentos de consulta generados correctamente", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Error al generar documentos", type: "error" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Identidad del paciente */}
      <PatientHeader patient={appointment.patient} />

      {/* Layout clínico jerárquico */}
      <div className="grid grid-cols-12 gap-6">
        {/* Columna izquierda: Documentos + Cobros */}
        <div className="col-span-3 space-y-4">
          <div className="rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800">
            <DocumentsPanel
              patientId={appointment.patient.id}
              appointmentId={appointment.id}
            />
          </div>

          <div className="rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800">
            <ChargeOrderPanel appointmentId={appointment.id} />
          </div>
        </div>

        {/* Columna derecha: Flujo clínico dominante */}
        <div className="col-span-9">
          <ConsultationWorkflow
            diagnoses={appointment.diagnoses}
            appointmentId={appointment.id}
            notes={appointment.notes ?? null}
            readOnly={false}
          />
        </div>
      </div>

      {/* Footer: Botones de acción */}
      <div className="flex flex-col gap-4 mt-6">
        <div className="flex items-center justify-between">
          <ConsultationActions consultationId={appointment.id} />

          {canGenerateReport && (
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                disabled={generateReport.isPending}
                onClick={handleGenerateReport}
              >
                {generateReport.isPending ? "Generando..." : "Generar Informe Médico"}
              </button>

              {generateReport.data?.file_url && (
                <a
                  href={generateReport.data.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
                >
                  Ver Informe Médico
                </a>
              )}

              <button
                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                disabled={generateDocuments.isPending}
                onClick={handleGenerateDocuments}
              >
                {generateDocuments.isPending
                  ? "Generando..."
                  : "Generar Documentos de Consulta"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast feedback */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
