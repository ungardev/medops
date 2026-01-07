// src/pages/Patients/PatientConsultationsDetail.tsx
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useConsultationById } from "../../hooks/consultations/useConsultationById";
import {
  PatientHeader,
  DocumentsPanel,
  ChargeOrderPanel,
} from "../../components/Consultation";
import ConsultationWorkflow from "../../components/Consultation/ConsultationWorkflow";
import ConsultationDocumentsActions from "../../components/Consultation/ConsultationDocumentsActions";
import ExportSuccessToast from "../../components/Common/ExportSuccessToast";
import ExportErrorToast from "../../components/Common/ExportErrorToast";
import { 
  LockClosedIcon, 
  PencilSquareIcon, 
  CommandLineIcon,
  ShieldCheckIcon 
} from "@heroicons/react/24/outline";

// Importamos el tipo base para la transformación
import type { Patient as FullPatient } from "../../types/patients";

/**
 * 🛠️ UTILIDADES DE TRANSFORMACIÓN (Protocolo de Integridad de Datos)
 */
function calcAge(birthdate?: string | null): number | null {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

const transformToPatientHeader = (p: any): FullPatient & { balance_due?: number; age?: number | null } => {
  const firstName = p.first_name || "";
  const lastName = p.last_name || "";
  
  // Requisito estricto: full_name debe existir para el tipo FullPatient
  const full_name = p.full_name ?? 
    [p.first_name, p.middle_name, p.last_name, p.second_last_name].filter(Boolean).join(" ").trim();

  return {
    ...p,
    id: p.id,
    full_name,
    first_name: firstName,
    last_name: lastName,
    national_id: p.national_id || "NOT_FOUND",
    age: p.age ?? calcAge(p.birthdate),
    balance_due: p.balance_due ?? 0,
    address_chain: p.address_chain || {},
    allergies: Array.isArray(p.allergies) ? p.allergies.join(", ") : String(p.allergies || ""),
    medical_history: Array.isArray(p.medical_history) ? p.medical_history.join(", ") : String(p.medical_history || ""),
  } as FullPatient & { balance_due?: number; age?: number | null };
};

export default function PatientConsultationsDetail() {
  const { patientId, appointmentId } = useParams<{ patientId: string; appointmentId: string }>();
  const appointmentIdNum = Number(appointmentId);

  const { data: appointment, isLoading, error } = useConsultationById(appointmentIdNum);
  
  // Estados para Feedback de Sistema (Toasts)
  const [successData, setSuccessData] = useState<{ docs: any[], skipped: string[] } | null>(null);
  const [errorData, setErrorData] = useState<{ category: string, error: string }[] | null>(null);

  const [readOnly, setReadOnly] = useState<boolean>(() => {
    const saved = localStorage.getItem("consultationReadOnly");
    return saved ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("consultationReadOnly", JSON.stringify(readOnly));
  }, [readOnly]);

  /**
   * ESTADOS DE CARGA Y ERROR (Terminal UI)
   */
  if (isLoading) return (
    <div className="min-h-screen bg-[var(--palantir-bg)] p-8 flex items-center gap-3 animate-pulse">
      <CommandLineIcon className="w-5 h-5 text-[var(--palantir-active)]" />
      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--palantir-muted)]">
        Initializing_Data_Stream...
      </span>
    </div>
  );

  if (error || !appointment) return (
    <div className="min-h-screen bg-[var(--palantir-bg)] p-8">
      <div className="border border-red-900/30 bg-red-950/10 p-4 text-red-500 text-[10px] font-mono uppercase flex items-center gap-3">
        <ShieldCheckIcon className="w-4 h-4" />
        Critical_Error: Failed_to_load_session_data_at_id_{appointmentId}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--palantir-bg)] text-[var(--palantir-text)] p-4 lg:p-6 space-y-6">
      
      {/* 1. STATUS BAR: LOCK/EDIT OVERRIDE */}
      <div className={`
        flex items-center justify-between px-4 py-2 border rounded-sm transition-all duration-500
        ${readOnly 
          ? "border-[var(--palantir-border)] bg-white/5" 
          : "border-yellow-900/50 bg-yellow-950/10 shadow-[0_0_20px_rgba(234,179,8,0.1)]"}
      `}>
        <div className="flex items-center gap-3">
          {readOnly ? (
            <LockClosedIcon className="w-4 h-4 text-[var(--palantir-muted)]" />
          ) : (
            <PencilSquareIcon className="w-4 h-4 text-yellow-500 animate-pulse" />
          )}
          <div className="flex flex-col">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${readOnly ? "text-[var(--palantir-muted)]" : "text-yellow-500"}`}>
              {readOnly ? "Session_Locked" : "Write_Access_Enabled"}
            </span>
            <span className="text-[7px] font-mono opacity-40 uppercase tracking-tighter">
              Level_04_Authorization_Required
            </span>
          </div>
        </div>
        
        <button
          onClick={() => setReadOnly(!readOnly)}
          className={`text-[9px] font-mono px-4 py-1.5 border transition-all rounded-sm uppercase tracking-widest ${
            readOnly 
            ? "border-[var(--palantir-border)] text-[var(--palantir-muted)] hover:bg-white/5" 
            : "border-yellow-500/50 text-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/20"
          }`}
        >
          {readOnly ? "[ Open_Session ]" : "[ Lock_Session ]"}
        </button>
      </div>

      {/* 2. CLINICAL_HEADER: PATIENT_CORE_DATA */}
      <div className="border border-[var(--palantir-border)] bg-[#0c0c0c] rounded-sm shadow-2xl overflow-hidden">
        <PatientHeader patient={transformToPatientHeader(appointment.patient)} />
      </div>

      {/* 3. MISSION_CONTROL_GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT_COLUMN: ASSETS & FINANCE (3-SPAN) */}
        <div className="lg:col-span-3 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2 opacity-30">
              <ShieldCheckIcon className="w-3 h-3 text-[var(--palantir-active)]" />
              <span className="text-[8px] font-mono uppercase tracking-widest text-[var(--palantir-text)]">Vault_Documents</span>
            </div>
            <DocumentsPanel
              patientId={appointment.patient.id}
              appointmentId={appointment.id}
              readOnly={readOnly}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 opacity-30">
              <CommandLineIcon className="w-3 h-3 text-emerald-500" />
              <span className="text-[8px] font-mono uppercase tracking-widest text-[var(--palantir-text)]">Transaction_Log</span>
            </div>
            <ChargeOrderPanel
              appointmentId={appointment.id}
              chargeOrder={appointment.charge_order}
              readOnly={readOnly}
            />
          </section>
        </div>

        {/* RIGHT_COLUMN: WORKFLOW_CORE (9-SPAN) */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="bg-white/[0.01] border border-[var(--palantir-border)] rounded-sm">
            <ConsultationWorkflow
              diagnoses={appointment.diagnoses}
              appointmentId={appointment.id}
              notes={appointment.notes ?? null}
              readOnly={readOnly}
            />
          </div>

          {/* EXPORT_ACTIONS_ZONE */}
          <div className="p-4 bg-gradient-to-r from-white/[0.03] to-transparent border border-white/5 rounded-sm">
            <div className="mb-4">
              <span className="text-[8px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
                System_Output_Protocols
              </span>
            </div>
            <ConsultationDocumentsActions consultationId={appointment.id} />
          </div>
        </div>
      </div>

      {/* 4. OVERLAY_NOTIFICATIONS (Log-style) */}
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
