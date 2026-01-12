import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ShieldCheckIcon, 
  BeakerIcon, 
  DocumentTextIcon, 
  ChevronRightIcon,
  ExclamationTriangleIcon,
  FingerPrintIcon
} from "@heroicons/react/24/outline";

// Componentes Tácticos
import { PatientHeader, DocumentsPanel, ChargeOrderPanel } from "../../components/Consultation";
import ConsultationWorkflow from "../../components/Consultation/ConsultationWorkflow";
import PageHeader from "../../components/Common/PageHeader";
import CollapsiblePanel from "../../components/Common/CollapsiblePanel";
import Toast from "../../components/Common/Toast";
import ExportErrorToast from "../../components/Common/ExportErrorToast";
import ExportSuccessToast from "../../components/Common/ExportSuccessToast";
import MedicalReportSuccessToast from "../../components/Common/MedicalReportSuccessToast";

// Hooks
import { useCurrentConsultation } from "../../hooks/consultations/useCurrentConsultation";
import { useGenerateMedicalReport } from "../../hooks/consultations/useGenerateMedicalReport";
import { useGenerateConsultationDocuments } from "../../hooks/consultations/useGenerateConsultationDocuments";

// Tipos y Utils
import type { GenerateDocumentsResponse, GeneratedDocument } from "../../hooks/consultations/useGenerateConsultationDocuments";
import type { MedicalReport } from "../../types/medicalReport";
import { toPatientHeaderPatient } from "../../utils/patientTransform";
import { getPatient } from "../../api/patients";

// 🕒 SUB-COMPONENTE: CRONÓMETRO DE SESIÓN (Basado en started_at)
const SessionTimer = ({ startTime }: { startTime: string | undefined | null }) => {
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    // Si no hay startTime (la consulta no ha "iniciado" realmente), el reloj queda en standby
    if (!startTime) {
      setElapsed("STANDBY");
      return;
    }

    const calculate = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      
      if (isNaN(start)) return "00:00";
      
      const diff = Math.max(0, now - start);
      
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      return h > 0 
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    setElapsed(calculate());
    const timer = setInterval(() => setElapsed(calculate()), 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  return <span className="font-mono tabular-nums tracking-widest">{elapsed}</span>;
};

export default function Consultation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Usamos el hook unificado que contiene query y mutaciones
  const { consultationQuery, updateStatus } = useCurrentConsultation();
  const { data: appointment, isLoading } = consultationQuery;
  
  const generateReport = useGenerateMedicalReport();
  const generateDocuments = useGenerateConsultationDocuments();

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [exportErrors, setExportErrors] = useState<{ category: string; error: string }[] | null>(null);
  const [exportSuccess, setExportSuccess] = useState<{ documents: GeneratedDocument[]; skipped: string[] } | null>(null);
  const [reportSuccess, setReportSuccess] = useState<{ fileUrl?: string | null; auditCode?: string | null } | null>(null);
  const [patientProfile, setPatientProfile] = useState<any | null>(null);

  // Redirección si no hay consulta activa
  useEffect(() => {
    if (!isLoading && !appointment) {
      navigate("/waitingroom");
    }
  }, [appointment, isLoading, navigate]);

  // Carga de perfil extendido del paciente
  useEffect(() => {
    if (appointment?.patient?.id) {
      getPatient(appointment.patient.id)
        .then((full) => setPatientProfile(full))
        .catch((e) => console.error("CRITICAL_PROFILE_LOAD_ERROR:", e));
    }
  }, [appointment?.patient?.id]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--palantir-bg)]">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-[var(--palantir-active)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--palantir-active)] animate-pulse">
          Initializing_Surgical_Environment...
        </p>
      </div>
    </div>
  );

  if (!appointment) return null;

  const patient = patientProfile ? toPatientHeaderPatient(patientProfile) : null;
  const canGenerateReport = appointment.status === "in_consultation" || appointment.status === "completed";

  const handleGenerateReport = async () => {
    try {
      const report: MedicalReport = await generateReport.mutateAsync(appointment.id);
      queryClient.invalidateQueries({ queryKey: ["documents", appointment.patient.id, appointment.id] });
      setReportSuccess({ fileUrl: report.file_url, auditCode: report.audit_code });
    } catch (err: any) {
      setToast({ message: err.message || "Error al generar informe", type: "error" });
    }
  };

  const handleGenerateDocuments = async () => {
    try {
      const resp: GenerateDocumentsResponse = await generateDocuments.mutateAsync(appointment.id);
      queryClient.invalidateQueries({ queryKey: ["documents", appointment.patient.id, appointment.id] });
      if (resp.errors?.length > 0) {
        setExportErrors(resp.errors);
      } else {
        setExportSuccess({ documents: resp.documents, skipped: resp.skipped });
      }
    } catch (err: any) {
      setToast({ message: err.message || "Error al generar documentos", type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--palantir-bg)] text-[var(--palantir-text)] p-4 sm:p-6 space-y-6">
      
      <PageHeader 
        title="CONSULTATION"
        breadcrumb={`MEDOPS // OPERATIVE_SYSTEM // SESSION_ID_${appointment.id.toString().padStart(6, '0')}`}
        stats={[
          { 
            label: "SESSION_ID", 
            value: `SESS-${appointment.id.toString().padStart(4, '0')}`,
            color: "text-[var(--palantir-active)]"
          },
          { 
            label: "ELAPSED_TIME", 
            // ⚡️ CAMBIO CLAVE: Usamos started_at en lugar de created_at
            value: <SessionTimer startTime={appointment.started_at} />,
            color: "text-emerald-400 font-bold"
          },
          { 
            label: "STATUS", 
            value: appointment.status.toUpperCase(),
            color: appointment.status === 'in_consultation' ? "text-emerald-500" : "text-amber-500"
          },
          { 
            label: "UPLINK", 
            value: "ENCRYPTED_LIVE",
            color: "text-blue-400"
          }
        ]}
        actions={
          <div className="flex items-center gap-4 px-3">
            <div className="h-10 w-10 flex items-center justify-center bg-[var(--palantir-active)]/10 border border-[var(--palantir-active)]/30 rounded-sm">
              <FingerPrintIcon className="w-5 h-5 text-[var(--palantir-active)] animate-pulse" />
            </div>
          </div>
        }
      />

      <div className="relative overflow-hidden border border-[var(--palantir-border)] bg-[var(--palantir-surface)] p-1 shadow-lg group">
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--palantir-active)] group-hover:shadow-[0_0_15px_var(--palantir-active)] transition-all duration-500" />
        {patient ? <PatientHeader patient={patient} /> : (
          <div className="p-10 text-center animate-pulse bg-black/10">
            <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-[var(--palantir-muted)]">Awaiting_Subject_BioData...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 space-y-4">
          <CollapsiblePanel title="Clinical_Documents">
            <DocumentsPanel patientId={appointment.patient.id} appointmentId={appointment.id} />
          </CollapsiblePanel>
          <CollapsiblePanel title="Financial_Ledger">
            <ChargeOrderPanel appointmentId={appointment.id} />
          </CollapsiblePanel>
        </aside>

        <main className="lg:col-span-9 space-y-6">
          <div className="bg-[var(--palantir-surface)] border border-[var(--palantir-border)] p-1 relative min-h-[600px] flex flex-col shadow-2xl">
            <div className="flex-1 bg-[var(--palantir-bg)]/50 p-4 sm:p-6">
              <ConsultationWorkflow
                diagnoses={appointment.diagnoses}
                appointmentId={appointment.id}
                notes={appointment.notes ?? null}
                readOnly={false}
              />
            </div>

            <footer className="border-t border-[var(--palantir-border)] bg-black/40 p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if(confirm("Confirm: Abort and Discard Session?")) {
                      await updateStatus.mutateAsync({ id: appointment.id, status: "canceled" });
                      navigate("/waitingroom");
                    }
                  }}
                  disabled={updateStatus.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 border border-red-500/20"
                >
                  <ExclamationTriangleIcon className="w-4 h-4" /> Abort_Mission
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {canGenerateReport && (
                  <>
                    <button
                      disabled={generateDocuments.isPending}
                      onClick={handleGenerateDocuments}
                      className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                      <DocumentTextIcon className="w-4 h-4" /> Batch_Export
                    </button>
                    <button
                      disabled={generateReport.isPending}
                      onClick={handleGenerateReport}
                      className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-[var(--palantir-active)] text-[var(--palantir-active)] hover:bg-[var(--palantir-active)] hover:text-white"
                    >
                      <ShieldCheckIcon className="w-4 h-4" /> Final_Medical_Report
                    </button>
                  </>
                )}

                <button
                  onClick={async () => {
                    await updateStatus.mutateAsync({ id: appointment.id, status: "completed" });
                    setToast({ message: "Surgical Session Complete", type: "success" });
                    navigate("/waitingroom");
                  }}
                  disabled={updateStatus.isPending}
                  className="group flex items-center gap-3 px-6 py-2 bg-[var(--palantir-active)] text-white hover:bg-blue-600 shadow-[0_0_20px_rgba(30,136,229,0.3)]"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {updateStatus.isPending ? "Finalizing..." : "Commit_Session"}
                  </span>
                  <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {exportErrors && <ExportErrorToast errors={exportErrors} onClose={() => setExportErrors(null)} />}
      {exportSuccess && <ExportSuccessToast documents={exportSuccess.documents} skipped={exportSuccess.skipped} onClose={() => setExportSuccess(null)} />}
      {reportSuccess && <MedicalReportSuccessToast fileUrl={reportSuccess.fileUrl} auditCode={reportSuccess.auditCode} onClose={() => setReportSuccess(null)} />}
    </div>
  );
}
