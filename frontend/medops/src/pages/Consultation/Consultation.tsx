// src/pages/Consultation/Consultation.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { 
  ShieldCheckIcon, 
  DocumentTextIcon, 
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { PatientHeader, DocumentsPanel, ChargeOrderPanel } from "../../components/Consultation";
import ConsultationWorkflow from "../../components/Consultation/ConsultationWorkflow";
import CommitSessionModal from "../../components/Consultation/CommitSessionModal";
import PageHeader from "../../components/Common/PageHeader";
import CollapsiblePanel from "../../components/Common/CollapsiblePanel";
import Toast from "../../components/Common/Toast";
import ExportErrorToast from "../../components/Common/ExportErrorToast";
import ExportSuccessToast from "../../components/Common/ExportSuccessToast";
import { useCurrentConsultation } from "../../hooks/consultations/useCurrentConsultation";
import { useGenerateMedicalReport } from "../../hooks/consultations/useGenerateMedicalReport";
import { useGenerateConsultationDocuments } from "../../hooks/consultations/useGenerateConsultationDocuments";
import { useInstitutions } from "../../hooks/settings/useInstitutions";
import type { GenerateDocumentsResponse, GeneratedDocument } from "../../hooks/consultations/useGenerateConsultationDocuments";
import { toPatientHeaderPatient } from "../../utils/patientTransform";
const SessionTimer = ({ startTime }: { startTime: string | undefined | null }) => {
  const [elapsed, setElapsed] = useState("00:00");
  useEffect(() => {
    if (!startTime) {
      setElapsed("00:00");
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
  return <span className="tabular-nums">{elapsed}</span>;
};
export default function Consultation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { consultationQuery, updateStatus } = useCurrentConsultation();
  const { data: appointment, isLoading, isFetching } = consultationQuery;
  
  const { activeInstitution } = useInstitutions();
  
  const generateReport = useGenerateMedicalReport();
  const generateDocuments = useGenerateConsultationDocuments();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [exportErrors, setExportErrors] = useState<{ category: string; error: string }[] | null>(null);
  const [exportSuccess, setExportSuccess] = useState<{ documents: GeneratedDocument[]; skipped: string[] } | null>(null);
  const [showCommitModal, setShowCommitModal] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    if (!isLoading && !isFetching) {
      setInitialized(true);
    }
    if (initialized && !isLoading && !isFetching && !appointment) {
      navigate("/waitingroom");
    }
  }, [initialized, appointment, isLoading, isFetching, navigate]);

  if (isLoading || isFetching) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-5">
        <div className="w-12 h-12 border-[3px] border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-emerald-400 animate-pulse">
          Cargando consulta...
        </p>
      </div>
    </div>
  );
  
  if (!appointment) return null;
  
  const patient = appointment.patient ? toPatientHeaderPatient(appointment.patient as any) : null;
  const canGenerateReport = appointment.status === "in_consultation" || appointment.status === "completed";
  const isInstitutionMatch = !appointment.institution || appointment.institution === activeInstitution?.id;
  const isCrossInstitution = !!appointment.institution && appointment.institution !== activeInstitution?.id;
  
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
  
  const handleCommitSession = async () => {
    await updateStatus.mutateAsync({ id: appointment.id, status: "completed" });
    queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    setToast({ message: "Sesión completada exitosamente", type: "success" });
    setShowCommitModal(false);
    navigate("/waitingroom");
  };
  const billingTotal = Number(appointment.charge_order?.total_amount || 0);
  const billingPending = Number(appointment.balance_due || 0);
  const documentsCount = appointment.documents_count || 0;
  return (
    <div className="space-y-6">
      
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/doctor" },
          { label: "Consulta", active: true }
        ]}
        stats={[
          { 
            label: "Sesión", 
            value: `#${appointment.id.toString().padStart(4, '0')}`,
            color: "text-blue-400"
          },
          { 
            label: "Tiempo", 
            value: <SessionTimer startTime={appointment.started_at} />,
            color: "text-emerald-400"
          }
        ]}
        children={patient ? <PatientHeader patient={patient} /> : null}
      />
      
      {isCrossInstitution && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 mx-4">
          <div className="flex items-center justify-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />
            <div className="text-center">
              <h3 className="text-sm font-medium text-amber-300">
                Acceso interinstitucional
              </h3>
              <p className="text-xs text-amber-400/70 mt-1">
                {appointment.institution_name || "Instituci\u00f3n desconocida"} \u2022 Solo lectura
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <main className="lg:col-span-9 space-y-4">
          <div className="bg-white/5 border border-white/15 p-1 relative min-h-[500px] flex flex-col rounded-xl">
            <div className="flex-1 bg-black/10 p-6 rounded-xl">
              <ConsultationWorkflow
                diagnoses={appointment.diagnoses}
                appointmentId={appointment.id}
                treatments={appointment.treatments}
                readOnly={Boolean(!isInstitutionMatch || isCrossInstitution)}
              />
            </div>
            
            <footer className="border-t border-white/10 bg-white/5 p-5 flex flex-wrap items-center justify-between gap-3 rounded-b-xl">
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if(confirm("\u00bfCancelar y descartar la sesi\u00f3n?")) {
                      await updateStatus.mutateAsync({ id: appointment.id, status: "canceled" });
                      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
                      navigate("/waitingroom");
                    }
                  }}
                  disabled={updateStatus.isPending || !isInstitutionMatch}
                  className="flex items-center gap-2 px-5 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 border border-red-500/25 transition-all disabled:opacity-50 rounded-xl"
                >
                  <ExclamationTriangleIcon className="w-5 h-5" /> Cancelar Sesi\u00f3n
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {canGenerateReport && isInstitutionMatch && (
                  <>
                    <button
                      disabled={generateDocuments.isPending}
                      onClick={handleGenerateDocuments}
                      className="flex items-center gap-2 px-5 py-3 text-sm font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all rounded-xl disabled:opacity-70"
                    >
                      {generateDocuments.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <DocumentTextIcon className="w-4 h-4" /> Generar Documentos
                        </>
                      )}
                    </button>
                    <button
                      disabled={generateReport.isPending}
                      onClick={handleGenerateReport}
                      className="flex items-center gap-2 px-5 py-3 text-sm font-medium bg-blue-500/15 text-blue-400 border border-blue-500/25 hover:bg-blue-500/25 transition-all rounded-xl disabled:opacity-70"
                    >
                      {generateReport.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <ShieldCheckIcon className="w-4 h-4" /> Informe Médico
                        </>
                      )}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowCommitModal(true)}
                  disabled={updateStatus.isPending || !isInstitutionMatch}
                  className="group flex items-center gap-2 px-6 py-3 bg-blue-500 text-white hover:bg-blue-400 transition-all rounded-xl disabled:opacity-50"
                >
                  {updateStatus.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-semibold">Completando...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-semibold">
                        Completar Sesi\u00f3n
                      </span>
                      <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </footer>
          </div>
        </main>
        
        <aside className="lg:col-span-3 space-y-4">
          <CollapsiblePanel title="Documentos Clínicos">
            <DocumentsPanel patientId={appointment.patient.id} appointmentId={appointment.id} />
          </CollapsiblePanel>
          <CollapsiblePanel title="Facturación">
            <ChargeOrderPanel appointmentId={appointment.id} />
          </CollapsiblePanel>
        </aside>
      </div>
      
      <CommitSessionModal
        open={showCommitModal}
        onClose={() => setShowCommitModal(false)}
        onConfirm={handleCommitSession}
        isPending={updateStatus.isPending}
        sessionId={appointment.id}
        patientName={appointment.patient?.full_name || "Paciente"}
        startedAt={appointment.started_at}
        diagnosesCount={appointment.diagnoses?.length || 0}
        treatmentsCount={appointment.treatments?.length || 0}
        billingTotal={billingTotal}
        billingPending={billingPending}
        documentsCount={documentsCount}
      />
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {exportErrors && <ExportErrorToast errors={exportErrors} onClose={() => setExportErrors(null)} />}
      {exportSuccess && <ExportSuccessToast documents={exportSuccess.documents} skipped={exportSuccess.skipped} onClose={() => setExportSuccess(null)} />}
    </div>
  );
}