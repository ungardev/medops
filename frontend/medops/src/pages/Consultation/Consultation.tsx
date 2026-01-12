// src/pages/Consultation/Consultation.tsx
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
import { useCurrentConsultation } from "../../hooks/consultations";
import { useGenerateMedicalReport } from "../../hooks/consultations/useGenerateMedicalReport";
import { useGenerateConsultationDocuments } from "../../hooks/consultations/useGenerateConsultationDocuments";
import { useConsultationActions } from "../../hooks/consultations/useConsultationActions";

// Tipos y Utils
import type { GenerateDocumentsResponse, GeneratedDocument } from "../../hooks/consultations/useGenerateConsultationDocuments";
import type { MedicalReport } from "../../types/medicalReport";
import { toPatientHeaderPatient } from "../../utils/patientTransform";
import { getPatient } from "../../api/patients";

// 🕒 SUB-COMPONENTE: CRONÓMETRO DE SESIÓN
const SessionTimer = ({ startTime }: { startTime: string }) => {
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    const timer = setInterval(() => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, now - start);

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      const timeString = h > 0 
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      
      setElapsed(timeString);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  return <span className="font-mono tabular-nums tracking-widest">{elapsed}</span>;
};

export default function Consultation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: appointment, isLoading } = useCurrentConsultation();
  const { complete, cancel, isPending } = useConsultationActions();
  
  const generateReport = useGenerateMedicalReport();
  const generateDocuments = useGenerateConsultationDocuments();

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [exportErrors, setExportErrors] = useState<{ category: string; error: string }[] | null>(null);
  const [exportSuccess, setExportSuccess] = useState<{ documents: GeneratedDocument[]; skipped: string[] } | null>(null);
  const [reportSuccess, setReportSuccess] = useState<{ fileUrl?: string | null; auditCode?: string | null } | null>(null);
  const [patientProfile, setPatientProfile] = useState<any | null>(null);

  useEffect(() => {
    if (!isLoading && !appointment) {
      navigate("/waitingroom");
    }
  }, [appointment, isLoading, navigate]);

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
    <div className="min-h-screen bg-[var(--palantir-bg)] text-[var(--palantir-text)] p-4 sm:p-6 space-y-6">
      
      {/* 🚀 PAGE_HEADER: HUB DE OPERACIONES CLÍNICAS */}
      <PageHeader 
        title="CLINICAL_SESSION_TERMINAL"
        breadcrumb={`MEDOPS // OPERATIVE_SYSTEM // SESSION_${appointment.id}`}
        stats={[
          { 
            label: "SESSION_ID", 
            value: `SESS-${appointment.id.toString().padStart(4, '0')}`,
            color: "text-[var(--palantir-active)]"
          },
          { 
            label: "ELAPSED_TIME", 
            value: <SessionTimer startTime={appointment.created_at} />,
            color: "text-emerald-400"
          },
          { 
            label: "SESSION_STATUS", 
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
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-tighter">Auth_Practitioner</span>
              <span className="text-[10px] font-black text-[var(--palantir-active)] uppercase">Root_User</span>
            </div>
            <div className="h-10 w-10 flex items-center justify-center bg-[var(--palantir-active)]/10 border border-[var(--palantir-active)]/30 rounded-sm">
              <FingerPrintIcon className="w-5 h-5 text-[var(--palantir-active)] animate-pulse" />
            </div>
          </div>
        }
      />

      {/* 01. PATIENT_TELEMETRY_STRIP (Identidad del Sujeto) */}
      <div className="relative overflow-hidden border border-[var(--palantir-border)] bg-[var(--palantir-surface)] p-1 shadow-lg group">
        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--palantir-active)] group-hover:shadow-[0_0_15px_var(--palantir-active)] transition-all" />
        {patient ? (
          <PatientHeader patient={patient} />
        ) : (
          <div className="p-10 text-center animate-pulse border border-dashed border-[var(--palantir-border)]">
            <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-[var(--palantir-muted)]">Awaiting_Subject_BioData...</span>
          </div>
        )}
      </div>

      {/* 02. MAIN OPERATIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SIDEBAR */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2 px-2 py-1 border-l-2 border-[var(--palantir-active)]">
            <BeakerIcon className="w-4 h-4 text-[var(--palantir-active)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)]">Data_Modules</span>
          </div>
          
          <CollapsiblePanel title="Clinical_Documents">
            <DocumentsPanel patientId={appointment.patient.id} appointmentId={appointment.id} />
          </CollapsiblePanel>
          
          <CollapsiblePanel title="Financial_Ledger">
            <ChargeOrderPanel appointmentId={appointment.id} />
          </CollapsiblePanel>

          <div className="p-4 border border-dashed border-[var(--palantir-border)]/40 bg-black/10 rounded-sm">
            <p className="text-[8px] font-mono uppercase text-[var(--palantir-muted)] leading-relaxed">
              Security_Node: CENTRAL_SBY<br/>
              Session_Encryption: AES_256_GCM<br/>
              Status: SECURE_LINK
            </p>
          </div>
        </aside>

        {/* MAIN WORKFLOW */}
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

            {/* ACTION DOCK */}
            <footer className="border-t border-[var(--palantir-border)] bg-black/40 p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if(confirm("Confirm: Terminate Consultation Session?")) {
                      await cancel(appointment.id);
                      navigate("/waitingroom");
                    }
                  }}
                  disabled={isPending}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all border border-red-500/20"
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
                      className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                      <DocumentTextIcon className="w-4 h-4" /> Batch_Export
                    </button>

                    <button
                      disabled={generateReport.isPending}
                      onClick={handleGenerateReport}
                      className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-[var(--palantir-active)] text-[var(--palantir-active)] hover:bg-[var(--palantir-active)] hover:text-white transition-all"
                    >
                      <ShieldCheckIcon className="w-4 h-4" /> Final_Medical_Report
                    </button>
                  </>
                )}

                <button
                  onClick={async () => {
                    await complete(appointment.id);
                    setToast({ message: "Surgical Session Complete", type: "success" });
                    navigate("/waitingroom");
                  }}
                  disabled={isPending}
                  className="group flex items-center gap-3 px-6 py-2 bg-[var(--palantir-active)] text-white hover:bg-blue-600 transition-all shadow-[0_0_20px_rgba(30,136,229,0.3)]"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isPending ? "Finalizing..." : "Commit_Session"}
                  </span>
                  <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* TOASTS Feedback System */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {exportErrors && <ExportErrorToast errors={exportErrors} onClose={() => setExportErrors(null)} />}
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
