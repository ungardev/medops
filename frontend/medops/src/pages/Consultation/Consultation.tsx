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
import ExportErrorToast from "../../components/Common/ExportErrorToast";
import ExportSuccessToast from "../../components/Common/ExportSuccessToast";
import MedicalReportSuccessToast from "../../components/Common/MedicalReportSuccessToast";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ResponsivePanel from "../../components/Consultation/ResponsivePanel";
import { useConsultationActions } from "../../hooks/consultations/useConsultationActions";
import CollapsiblePanel from "../../components/Common/CollapsiblePanel";
import { useNavigate } from "react-router-dom";
import type { GenerateDocumentsResponse, GeneratedDocument } from "../../hooks/consultations/useGenerateConsultationDocuments";
import type { MedicalReport } from "../../types/medicalReport";

// 🔹 Utilidades institucionales
import { toPatientHeaderPatient } from "../../utils/patientTransform";
import { getPatient } from "../../api/patients";

export default function Consultation() {
  const { data: appointment, isLoading } = useCurrentConsultation();
  const generateReport = useGenerateMedicalReport();
  const generateDocuments = useGenerateConsultationDocuments();
  const queryClient = useQueryClient();
  const { complete, cancel, isPending } = useConsultationActions();
  const navigate = useNavigate();

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [exportErrors, setExportErrors] = useState<{ category: string; error: string }[] | null>(null);
  const [exportSuccess, setExportSuccess] = useState<{ documents: GeneratedDocument[]; skipped: string[] } | null>(null);
  const [reportSuccess, setReportSuccess] = useState<{ fileUrl?: string | null; auditCode?: string | null } | null>(null);
  const [patientProfile, setPatientProfile] = useState<any | null>(null);

  useEffect(() => {
    if (appointment?.patient?.id) {
      getPatient(appointment.patient.id)
        .then((full) => setPatientProfile(full))
        .catch((e) => console.error("Error cargando perfil completo:", e));
    }
  }, [appointment?.patient?.id]);

  if (isLoading) return <p className="text-gray-500">Cargando consulta...</p>;

  if (!appointment) {
    navigate("/waitingroom");
    return null;
  }

  const patient = patientProfile ? toPatientHeaderPatient(patientProfile) : null;

  const canGenerateReport =
    appointment.status === "in_consultation" || appointment.status === "completed";

  const handleGenerateReport = async () => {
    try {
      const report: MedicalReport = await generateReport.mutateAsync(appointment.id);
      queryClient.invalidateQueries({
        queryKey: ["documents", appointment.patient.id, appointment.id],
      });
      setReportSuccess({ fileUrl: report.file_url, auditCode: report.audit_code });
    } catch (err: any) {
      setToast({ message: err.message || "Error al generar informe médico", type: "error" });
    }
  };

  const handleGenerateDocuments = async () => {
    try {
      const resp: GenerateDocumentsResponse = await generateDocuments.mutateAsync(appointment.id);
      queryClient.invalidateQueries({
        queryKey: ["documents", appointment.patient.id, appointment.id],
      });

      if (resp.errors && resp.errors.length > 0) {
        setExportErrors(resp.errors);
        setExportSuccess(null);
      } else {
        setExportSuccess({ documents: resp.documents, skipped: resp.skipped });
        setExportErrors(null);
      }
    } catch (err: any) {
      setToast({ message: err.message || "Error al generar documentos", type: "error" });
    }
  };
    return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Identidad del paciente */}
      {patient ? (
        <PatientHeader patient={patient} />
      ) : (
        <p className="text-sm text-gray-500">Cargando datos del paciente...</p>
      )}

      {/* Layout clínico */}
      {/* Mobile/Tablet */}
      <div className="lg:hidden space-y-4">
        <ResponsivePanel title="Documentos clínicos">
          <DocumentsPanel patientId={appointment.patient.id} appointmentId={appointment.id} />
        </ResponsivePanel>

        <ResponsivePanel title="Orden de Cobro">
          <ChargeOrderPanel appointmentId={appointment.id} />
        </ResponsivePanel>

        <div className="rounded-lg shadow-lg p-3 sm:p-4 bg-white dark:bg-gray-800">
          <ConsultationWorkflow
            diagnoses={appointment.diagnoses}
            appointmentId={appointment.id}
            notes={appointment.notes ?? null}
            readOnly={false}
          />
        </div>

        {/* Footer mobile/tablet */}
        <div className="flex flex-wrap justify-end gap-2 sm:gap-3 mt-6">
          <button
            onClick={async () => {
              await cancel(appointment.id);
              setToast({ message: "Consulta cancelada", type: "success" });
              navigate("/waitingroom");
            }}
            disabled={isPending}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md font-medium bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-colors whitespace-nowrap"
          >
            Cancelar consulta
          </button>

          <button
            onClick={async () => {
              await complete(appointment.id);
              setToast({ message: "Consulta finalizada", type: "success" });
              navigate("/waitingroom");
            }}
            disabled={isPending}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md font-medium bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors whitespace-nowrap"
          >
            {isPending ? "Finalizando..." : "Finalizar consulta"}
          </button>

          {canGenerateReport && (
            <>
              <button
                disabled={generateReport.isPending}
                onClick={handleGenerateReport}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md font-medium bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors whitespace-nowrap"
              >
                {generateReport.isPending ? "Generando..." : "Generar Informe Médico"}
              </button>

              {generateReport.data?.file_url && (
                <a
                  href={generateReport.data.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md font-medium bg-gray-100 text-[#0d2c53] border border-gray-300 hover:bg-gray-200 transition-colors whitespace-nowrap"
                >
                  Ver Informe Médico
                </a>
              )}

              <button
                disabled={generateDocuments.isPending}
                onClick={handleGenerateDocuments}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md font-medium bg-green-600 text-white border border-green-600 hover:bg-green-700 transition-colors whitespace-nowrap"
              >
                {generateDocuments.isPending ? "Generando..." : "Generar Documentos"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Desktop con CollapsiblePanel */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 relative">
        <div className="col-span-3 space-y-4">
          <CollapsiblePanel title="Documentos clínicos">
            <DocumentsPanel patientId={appointment.patient.id} appointmentId={appointment.id} />
          </CollapsiblePanel>
          <CollapsiblePanel title="Orden de Cobro">
            <ChargeOrderPanel appointmentId={appointment.id} />
          </CollapsiblePanel>
        </div>

        <div className="col-span-9 relative pb-20">
          <ConsultationWorkflow
            diagnoses={appointment.diagnoses}
            appointmentId={appointment.id}
            notes={appointment.notes ?? null}
            readOnly={false}
          />

          {/* Footer desktop */}
          <div className="absolute bottom-0 right-0 flex flex-wrap justify-end gap-2 sm:gap-3">
            <button
              onClick={async () => {
                await cancel(appointment.id);
                setToast({ message: "Consulta cancelada", type: "success" });
                navigate("/waitingroom");
              }}
              disabled={isPending}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md font-medium bg-red-100 text-red-700 border border-red-300 hover:bg-red-200 transition-colors whitespace-nowrap"
            >
              Cancelar consulta
            </button>

            <button
              onClick={async () => {
                await complete(appointment.id);
                setToast({ message: "Consulta finalizada", type: "success" });
                navigate("/waitingroom");
              }}
              disabled={isPending}
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md font-medium bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors whitespace-nowrap"
            >
              {isPending ? "Finalizando..." : "Finalizar consulta"}
            </button>

            {canGenerateReport && (
              <>
                <button
                  disabled={generateReport.isPending}
                  onClick={handleGenerateReport}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md font-medium bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors whitespace-nowrap"
                >
                  {generateReport.isPending ? "Generando..." : "Generar Informe Médico"}
                </button>

                {generateReport.data?.file_url && (
                  <a
                    href={generateReport.data.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md font-medium bg-gray-100 text-[#0d2c53] border border-gray-300 hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    Ver Informe Médico
                  </a>
                )}

                <button
                  disabled={generateDocuments.isPending}
                  onClick={handleGenerateDocuments}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-md font-medium bg-green-600 text-white border border-green-600 hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  {generateDocuments.isPending ? "Generando..." : "Generar Documentos"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast feedback */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {exportErrors && (
        <ExportErrorToast errors={exportErrors} onClose={() => setExportErrors(null)} />
      )}

      {exportSuccess && (
        <ExportSuccessToast
          documents={exportSuccess.documents}
          skipped={exportSuccess.skipped}
          onClose={() => setExportSuccess(null)}
        />
      )}

      {reportSuccess && (
        <MedicalReportSuccessToast
          fileUrl={reportSuccess.fileUrl}
          auditCode={reportSuccess.auditCode}
          onClose={() => setReportSuccess(null)}
        />
      )}
    </div>
  );
}
