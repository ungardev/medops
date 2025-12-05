// src/pages/Consultation/Consultation.tsx
import {
  PatientHeader,
  DocumentsPanel,
  ChargeOrderPanel,
} from "../../components/Consultation";

import { useCurrentConsultation } from "../../hooks/consultations";
import { useGenerateMedicalReport } from "../../hooks/consultations/useGenerateMedicalReport";
import { useGenerateConsultationDocuments } from "../../hooks/consultations/useGenerateConsultationDocuments";
import ConsultationWorkflow from "../../components/Consultation/ConsultationWorkflow";
import Toast from "../../components/Common/Toast";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ResponsivePanel from "../../components/Consultation/ResponsivePanel";
import { useConsultationActions } from "../../hooks/consultations/useConsultationActions";

export default function Consultation() {
  const { data: appointment, isLoading } = useCurrentConsultation();
  const generateReport = useGenerateMedicalReport();
  const generateDocuments = useGenerateConsultationDocuments();
  const queryClient = useQueryClient();
  const { complete, cancel, isPending } = useConsultationActions();

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

      {/* Layout clínico */}
      {/* Mobile/Tablet: vertical con ResponsivePanel */}
      <div className="lg:hidden space-y-4">
        <ResponsivePanel title="Documentos clínicos">
          <DocumentsPanel
            patientId={appointment.patient.id}
            appointmentId={appointment.id}
          />
        </ResponsivePanel>

        <ResponsivePanel title="Orden de Cobro">
          <ChargeOrderPanel appointmentId={appointment.id} />
        </ResponsivePanel>

        {/* ConsultationWorkflow siempre expandido */}
        <div className="rounded-lg shadow-lg p-3 sm:p-4 bg-white dark:bg-gray-800">
          <ConsultationWorkflow
            diagnoses={appointment.diagnoses}
            appointmentId={appointment.id}
            notes={appointment.notes ?? null}
            readOnly={false}
          />
        </div>

        {/* Footer: Botones de acción en mobile/tablet */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mt-6">
          <button
            onClick={() => cancel(appointment.id)}
            disabled={isPending}
            className="px-3 sm:px-4 py-2 text-[11px] sm:text-sm rounded-md font-medium border bg-gray-100 text-gray-700 border-gray-300 
                       hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            Cancelar consulta
          </button>

          <button
            onClick={() => complete(appointment.id)}
            disabled={isPending}
            className="px-3 sm:px-4 py-2 text-[11px] sm:text-sm rounded-md font-medium border bg-[#0d2c53] text-white border-[#0d2c53] 
                       hover:bg-[#0b2444] transition-colors whitespace-nowrap"
          >
            {isPending ? "Finalizando..." : "Finalizar consulta"}
          </button>

          {canGenerateReport && (
            <>
              <button
                className="px-3 sm:px-4 py-2 text-[11px] sm:text-sm rounded-md font-medium border bg-[#0d2c53] text-white border-[#0d2c53] hover:bg-[#0b2444] transition-colors whitespace-nowrap"
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
                  className="px-3 sm:px-4 py-2 text-[11px] sm:text-sm rounded-md font-medium border bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  Ver Informe Médico
                </a>
              )}

              <button
                className="px-3 sm:px-4 py-2 text-[11px] sm:text-sm rounded-md font-medium border bg-green-600 text-white border-green-600 hover:bg-green-700 transition-colors whitespace-nowrap"
                disabled={generateDocuments.isPending}
                onClick={handleGenerateDocuments}
              >
                {generateDocuments.isPending
                  ? "Generando..."
                  : "Generar Documentos"}
              </button>
            </>
          )}
        </div>
      </div>
                {/* Desktop: intacto, sagrado */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 relative">
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
        <div className="col-span-9 relative pb-20">
          <ConsultationWorkflow
            diagnoses={appointment.diagnoses}
            appointmentId={appointment.id}
            notes={appointment.notes ?? null}
            readOnly={false}
          />

          {/* Footer: Botones de acción en esquina inferior derecha */}
          <div className="absolute bottom-0 right-0 flex flex-wrap justify-end gap-2 sm:gap-3">
            <button
              onClick={() => cancel(appointment.id)}
              disabled={isPending}
              className="px-3 sm:px-4 py-2 text-[11px] sm:text-sm rounded-md font-medium border 
                         bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Cancelar consulta
            </button>

            <button
              onClick={() => complete(appointment.id)}
              disabled={isPending}
              className="px-3 sm:px-4 py-2 text-[11px] sm:text-sm rounded-md font-medium border 
                         bg-[#0d2c53] text-white border-[#0d2c53] hover:bg-[#0b2444] transition-colors whitespace-nowrap"
            >
              {isPending ? "Finalizando..." : "Finalizar consulta"}
            </button>

            {canGenerateReport && (
              <>
                <button
                  className="px-3 sm:px-4 py-2 text-[11px] sm:text-sm rounded-md font-medium border 
                             bg-[#0d2c53] text-white border-[#0d2c53] hover:bg-[#0b2444] transition-colors whitespace-nowrap"
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
                    className="px-3 sm:px-4 py-2 text-[11px] sm:text-sm rounded-md font-medium border 
                               bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    Ver Informe Médico
                  </a>
                )}

                <button
                  className="px-3 sm:px-4 py-2 text-[11px] sm:text-sm rounded-md font-medium border 
                             bg-green-600 text-white border-green-600 hover:bg-green-700 transition-colors whitespace-nowrap"
                  disabled={generateDocuments.isPending}
                  onClick={handleGenerateDocuments}
                >
                  {generateDocuments.isPending
                    ? "Generando..."
                    : "Generar Documentos"}
                </button>
              </>
            )}
          </div>
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
