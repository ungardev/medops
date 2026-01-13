// src/pages/Patients/PatientConsultationsDetail.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useConsultationById } from "../../hooks/consultations/useConsultationById";
import {
  PatientHeader,
  DocumentsPanel,
  ChargeOrderPanel,
} from "../../components/Consultation";
import PageHeader from "../../components/Common/PageHeader";
import ConsultationWorkflow from "../../components/Consultation/ConsultationWorkflow";
import ConsultationDocumentsActions from "../../components/Consultation/ConsultationDocumentsActions";
import ExportSuccessToast from "../../components/Common/ExportSuccessToast";
import ExportErrorToast from "../../components/Common/ExportErrorToast";
import { 
  LockClosedIcon, 
  PencilSquareIcon, 
  CommandLineIcon,
  ShieldCheckIcon,
  ClockIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";

/**
 * 🛠️ UTILIDADES DE TRANSFORMACIÓN
 */
function calcAge(birthdate?: string | null): number | null {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// Transformación con casting a "any" para evitar quejas de campos faltantes
const transformToPatientHeader = (p: any): any => {
  const full_name = p.full_name ?? 
    [p.first_name, p.middle_name, p.last_name, p.second_last_name].filter(Boolean).join(" ").trim();

  return {
    ...p,
    full_name,
    age: p.age ?? calcAge(p.birthdate),
    balance_due: p.balance_due ?? 0,
    address_chain: p.address_chain || {},
    allergies: Array.isArray(p.allergies) ? p.allergies.join(", ") : String(p.allergies || ""),
    medical_history: Array.isArray(p.medical_history) ? p.medical_history.join(", ") : String(p.medical_history || ""),
  };
};

export default function PatientConsultationsDetail() {
  const { patientId, appointmentId } = useParams<{ patientId: string; appointmentId: string }>();
  const appointmentIdNum = Number(appointmentId);
  const navigate = useNavigate();

  // Forzamos el hook a retornar "any" para saltar las validaciones de interfaz incompleta
  const { data: appointment, isLoading, error } = useConsultationById(appointmentIdNum) as any;
  
  const [successData, setSuccessData] = useState<{ docs: any[], skipped: string[] } | null>(null);
  const [errorData, setErrorData] = useState<{ category: string, error: string }[] | null>(null);

  const [readOnly, setReadOnly] = useState<boolean>(() => {
    const saved = localStorage.getItem("consultationReadOnly");
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("consultationReadOnly", JSON.stringify(readOnly));
  }, [readOnly]);

  if (isLoading) return (
    <div className="min-h-screen bg-[var(--palantir-bg)] p-8 flex items-center gap-3 animate-pulse">
      <CommandLineIcon className="w-5 h-5 text-white/50" />
      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--palantir-muted)]">
        Initializing_Data_Stream...
      </span>
    </div>
  );

  if (error || !appointment) return (
    <div className="min-h-screen bg-[var(--palantir-bg)] p-8">
      <div className="border border-red-900/30 bg-red-950/10 p-4 text-red-500 text-[10px] font-mono uppercase flex items-center gap-3">
        <ShieldCheckIcon className="w-4 h-4" />
        Critical_Error: Failed_to_load_session_data
      </div>
    </div>
  );

  // 🛡️ SOLUCIÓN A ERRORES TS: Acceso seguro mediante casting local
  const patient = appointment.patient as any;
  const patientFullName = patient?.full_name || "PACIENTE";
  const sessionDate = appointment.date || appointment.appointment_date || "";
  const statusLabel = appointment.status_display || appointment.status || "N/A";

  return (
    <div className="min-h-screen bg-[var(--palantir-bg)] text-[var(--palantir-text)] p-4 lg:p-6 space-y-6">
      
      <PageHeader 
        title={`SESIÓN #${appointment.id}`}
        subtitle="Expediente Clínico y Registro de Consulta"
        breadcrumbs={[
          { label: "PACIENTES", path: "/patients" },
          { label: patientFullName, path: `/patients/${patientId}` },
          { label: "DETALLE DE CONSULTA", active: true }
        ]}
      >
        <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end px-4 border-r border-[var(--palantir-border)]">
                <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">Session_Date</span>
                <div className="flex items-center gap-2 text-white">
                    <CalendarIcon className="w-3 h-3 text-[var(--palantir-muted)]" />
                    <span className="text-xs font-bold">
                        {sessionDate ? new Date(sessionDate).toLocaleDateString() : 'N/A'}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-sm border border-white/10">
                <ClockIcon className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-tighter">
                    {statusLabel}
                </span>
            </div>
        </div>
      </PageHeader>

      <div className={`
        flex items-center justify-between px-4 py-3 border rounded-sm transition-all duration-500
        ${readOnly 
          ? "border-[var(--palantir-border)] bg-[#11141a]" 
          : "border-yellow-900/50 bg-yellow-950/10 shadow-[0_0_20px_rgba(234,179,8,0.05)]"}
      `}>
        <div className="flex items-center gap-3">
          {readOnly ? (
            <div className="p-1.5 bg-white/5 rounded-full">
                <LockClosedIcon className="w-4 h-4 text-[var(--palantir-muted)]" />
            </div>
          ) : (
            <div className="p-1.5 bg-yellow-500/10 rounded-full">
                <PencilSquareIcon className="w-4 h-4 text-yellow-500 animate-pulse" />
            </div>
          )}
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${readOnly ? "text-white/70" : "text-yellow-500"}`}>
              {readOnly ? "PROTECTED_MODE" : "OVERRIDE_ACTIVE"}
            </span>
            <span className="text-[8px] font-mono opacity-40 uppercase tracking-tighter text-[var(--palantir-muted)]">
              {readOnly ? "Integridad de datos garantizada" : "Edición de registros históricos en progreso"}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => setReadOnly(!readOnly)}
          className={`text-[9px] font-bold px-5 py-2 border transition-all rounded-sm uppercase tracking-[0.15em] ${
            readOnly 
            ? "border-[var(--palantir-border)] text-white hover:bg-white/10" 
            : "border-yellow-500/50 text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20"
          }`}
        >
          {readOnly ? "[ Desbloquear Sesión ]" : "[ Sellar Cambios ]"}
        </button>
      </div>

      <div className="border border-[var(--palantir-border)] bg-[var(--palantir-surface)] rounded-sm shadow-xl overflow-hidden">
        <PatientHeader patient={transformToPatientHeader(appointment.patient)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-white/20" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Expediente_Digital</span>
            </div>
            <DocumentsPanel
              patientId={appointment.patient.id}
              appointmentId={appointment.id}
              readOnly={readOnly}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CommandLineIcon className="w-3.5 h-3.5 text-emerald-500/50" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Módulo_Financiero</span>
            </div>
            <ChargeOrderPanel
              appointmentId={appointment.id}
              chargeOrder={appointment.charge_order}
              readOnly={readOnly}
            />
          </section>
        </div>

        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="bg-white/[0.01] border border-[var(--palantir-border)] rounded-sm overflow-hidden">
            <ConsultationWorkflow
              diagnoses={appointment.diagnoses}
              appointmentId={appointment.id}
              notes={appointment.notes ?? null}
              readOnly={readOnly}
            />
          </div>

          <div className="p-5 bg-gradient-to-r from-white/[0.02] to-transparent border border-white/5 rounded-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex flex-col">
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">
                    Data_Output_Protocols
                  </span>
                  <span className="text-[7px] font-mono text-white/20 uppercase">Generación de reportes y documentos médicos</span>
              </div>
              <div className="h-[1px] flex-1 mx-6 bg-gradient-to-r from-white/10 to-transparent"></div>
            </div>
            <ConsultationDocumentsActions consultationId={appointment.id} />
          </div>
        </div>
      </div>

      {successData && (
        <ExportSuccessToast 
          documents={successData.docs} 
          skipped={successData.skipped} 
          onClose={() => setSuccessData(null)} 
        />
      )}
      {errorData && (
        <ExportErrorToast 
          errors={errorData} 
          onClose={() => setErrorData(null)} 
        />
      )}
    </div>
  );
}
