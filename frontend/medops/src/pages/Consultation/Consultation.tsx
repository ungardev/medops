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
import { useQueryClient } from "@tanstack/react-query";

export default function Consultation() {
  const { data: appointment, isLoading } = useCurrentConsultation();
  const generateReport = useGenerateMedicalReport();
  const generateDocuments = useGenerateConsultationDocuments();
  const queryClient = useQueryClient();

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  if (isLoading) return <p className="text-gray-500">Cargando consulta...</p>;
  if (!appointment) return <p className="text-red-600">No hay paciente en consulta</p>;

  const canGenerateReport =
    appointment.status === "in_consultation" || appointment.status === "completed";

  const handleGenerateReport = async () => {
    try {
      const report = await generateReport.mutateAsync(appointment.id);
      queryClient.invalidateQueries({
        queryKey: ["documents", appointment.patient.id, appointment.id],
      });
      setToast({ message: "Informe médico generado correctamente", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Error al generar informe médico", type: "error" });
    }
  };

  const handleGenerateDocuments = async () => {
    try {
      await generateDocuments.mutateAsync(appointment.id);
      queryClient.invalidateQueries({
        queryKey: ["documents", appointment.patient.id, appointment.id],
      });
      setToast({ message: "Documentos de consulta generados correctamente", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Error al generar documentos", type: "error" });
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Identidad del paciente */}
      <PatientHeader patient={appointment.patient} />

      {/* Layout clínico jerárquico */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6">
        {/* Columna izquierda: Documentos + Cobros */}
        <div className="col-span-12 sm:col-span-3 space-y-4">
          <div className="rounded-lg shadow-lg p-3 sm:p-4 bg-white dark:bg-gray-800">
            <DocumentsPanel
              patientId={appointment.patient.id}
              appointmentId={appointment.id}
            />
          </div>

          <div className="rounded-lg shadow-lg p-3 sm:p-4 bg-white dark:bg-gray-800">
            <ChargeOrderPanel appointmentId={appointment.id} />
          </div>
        </div>

        {/* Columna derecha: Flujo clínico dominante */}
        <div className="col-span-12 sm:col-span-9">
          <ConsultationWorkflow
            diagnoses={appointment.diagnoses}
            appointmentId={appointment.id}
            notes={appointment.notes ?? null}
            readOnly={false}
          />
        </div>
      </div>

      {/* Footer: Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <ConsultationActions consultationId={appointment.id} />

        {canGenerateReport && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <button
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors"
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
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors"
              >
                Ver Informe Médico
              </a>
            )}

            <button
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
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
