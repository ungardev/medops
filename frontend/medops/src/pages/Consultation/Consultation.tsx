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
  FingerPrintIcon,
  BuildingOfficeIcon
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
import { useInstitutions } from "../../hooks/settings/useInstitutions";
// Tipos y Utils
import type { GenerateDocumentsResponse, GeneratedDocument } from "../../hooks/consultations/useGenerateConsultationDocuments";
import { toPatientHeaderPatient } from "../../utils/patientTransform";
import { getPatient } from "../../api/patients";
// 🕒 SUB-COMPONENTE: CRONÓMETRO DE SESIÓN
const SessionTimer = ({ startTime }: { startTime: string | undefined | null }) => {
  const [elapsed, setElapsed] = useState("00:00");
  useEffect(() => {
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
  
  const { consultationQuery, updateStatus } = useCurrentConsultation();
  const { data: appointment, isLoading } = consultationQuery;
  
  const { activeInstitution } = useInstitutions();
  
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
  const isInstitutionMatch = !appointment.institution || appointment.institution === activeInstitution?.id;
  const isCrossInstitution = !!appointment.institution && appointment.institution !== activeInstitution?.id;
  // ✅ FIX: No espera retorno, el PDF se descarga automáticamente
  const handleGenerateReport = async () => {
    try {
      await generateReport.mutateAsync(appointment.id);
      queryClient.invalidateQueries({ queryKey: ["documents", appointment.patient.id, appointment.id] });
      setToast({ message: "Informe médico generado correctamente", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Error al generar informe", type: "error" });
    }
  };
  const handleGenerateDocuments = async () => {
    try {
      const resp: GenerateDocumentsResponse = await generateDocuments.mutateAsync({
        consultationId: appointment.id,
        patientId: appointment.patient.id,
      });
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
      
      {/* HEADER TÉCNICO */}
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "CONSULTATION", active: true }
        ]}
        stats={[
          { 
            label: "SESSION_NODE", 
            value: `SESS-${appointment.id.toString().padStart(4, '0')}`,
            color: "text-blue-500"
          },
          { 
            label: "ELAPSED_TIME", 
            value: <SessionTimer startTime={appointment.started_at} />,
            color: "text-emerald-400 font-bold"
          },
          { 
            label: "STATUS_CORE", 
            value: appointment.status.toUpperCase(),
            color: appointment.status === 'in_consultation' ? "text-emerald-500" : "text-amber-500"
          },
          { 
            label: "INSTITUTION", 
            value: activeInstitution?.name?.toUpperCase().slice(0, 15) || "NONE_SELECTED",
            color: isCrossInstitution ? "text-yellow-500" : "text-purple-500"
          },
          { 
            label: "ENCRYPTION", 
            value: "LIVE_AES256",
            color: "text-white/40"
          }
        ]}
        actions={
          <div className="flex items-center gap-3 px-3">
            {activeInstitution && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-sm">
                <BuildingOfficeIcon className="w-3 h-3 text-purple-400" />
                <span className="text-[7px] font-mono text-purple-300 uppercase tracking-[0.2em]">
                  {activeInstitution.tax_id}
                </span>
              </div>
            )}
            
            <div className="h-9 w-9 flex items-center justify-center bg-blue-500/10 border border-blue-500/30 rounded-sm">
              <FingerPrintIcon className="w-5 h-5 text-blue-500 animate-pulse" />
            </div>
          </div>
        }
      />
      {/* BANNER DE ALERTA CROSS-INSTITUCION */}
      {isCrossInstitution && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
              <div>
                <h3 className="text-[11px] font-black text-yellow-300 uppercase tracking-[0.3em]">
                  Cross-Institution Access Detected
                </h3>
                <p className="text-[8px] font-mono text-yellow-400/70 uppercase tracking-[0.2em] mt-1">
                  Consultation belongs to: {appointment.institution_name || "Unknown Institution"}
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-500/20 border border-yellow-500/30 px-3 py-1">
              <span className="text-[7px] font-mono text-yellow-400 uppercase tracking-[0.2em]">
                READ_ONLY_ACCESS
              </span>
            </div>
          </div>
        </div>
      )}
      <div className="relative overflow-hidden border border-white/10 bg-black/20 backdrop-blur-md p-1 shadow-2xl group">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-500" />
        {patient ? <PatientHeader patient={patient} /> : (
          <div className="p-10 text-center animate-pulse bg-black/10">
            <span className="text-[10px] font-mono uppercase tracking-[0.5em] text-white/20">Awaiting_Subject_BioData...</span>
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
          <div className="bg-black/20 border border-white/10 p-1 relative min-h-[600px] flex flex-col shadow-2xl">
            <div className="flex-1 bg-black/10 p-4 sm:p-6">
              <ConsultationWorkflow
                diagnoses={appointment.diagnoses}
                appointmentId={appointment.id}
                treatments={appointment.treatments}
                readOnly={Boolean(!isInstitutionMatch || isCrossInstitution)}
              />
            </div>
            
            <footer className="border-t border-white/10 bg-black/40 p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if(confirm("Confirm: Abort and Discard Session?")) {
                      await updateStatus.mutateAsync({ id: appointment.id, status: "canceled" });
                      navigate("/waitingroom");
                    }
                  }}
                  disabled={updateStatus.isPending || !isInstitutionMatch}
                  className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all disabled:opacity-50"
                >
                  <ExclamationTriangleIcon className="w-4 h-4" /> Abort_Mission
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {canGenerateReport && isInstitutionMatch && (
                  <>
                    <button
                      disabled={generateDocuments.isPending}
                      onClick={handleGenerateDocuments}
                      className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all"
                    >
                      <DocumentTextIcon className="w-4 h-4" /> Batch_Export
                    </button>
                    <button
                      disabled={generateReport.isPending}
                      onClick={handleGenerateReport}
                      className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-blue-500/40 text-blue-400 hover:bg-blue-500 hover:text-white transition-all"
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
                  disabled={updateStatus.isPending || !isInstitutionMatch}
                  className="group flex items-center gap-3 px-6 py-2 bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
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