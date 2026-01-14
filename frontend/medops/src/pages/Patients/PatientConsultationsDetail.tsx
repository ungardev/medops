// src/pages/Patients/PatientConsultationsDetail.tsx
import { useParams } from "react-router-dom";
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
 * 🛠️ UTILIDADES DE TRANSFORMACIÓN (In-place para desacoplar de tipos rígidos)
 */
function calcAge(birthdate?: string | null): number | null {
  if (!birthdate) return null;
  const d = new Date(birthdate);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

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
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-blue-500 animate-pulse">Initializing_Session_Link...</p>
      </div>
    </div>
  );

  if (error || !appointment) return (
    <div className="min-h-screen bg-black p-8">
      <div className="border border-red-500/30 bg-red-500/5 p-4 text-red-500 text-[10px] font-mono uppercase flex items-center gap-3">
        <ShieldCheckIcon className="w-4 h-4" />
        Critical_Error: Data_Stream_Corrupted // Access_Denied
      </div>
    </div>
  );

  const patient = appointment.patient as any;
  const patientFullName = patient?.full_name || "SUBJECT_NAME_UNDEFINED";
  const sessionDate = appointment.date || appointment.appointment_date || "";
  const statusLabel = appointment.status_display || appointment.status || "N/A";

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-6 space-y-6">
      
      {/* 🚀 HEADER: Navegación de Carpeta Clínica */}
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "PATIENTS", path: "/patients" },
          { label: patientFullName, path: `/patients/${patientId}` },
          { label: `CONSULTATION_SESS_${appointment.id}`, active: true }
        ]}
        stats={[
          { 
            label: "SESSION_NODE", 
            value: `#${appointment.id.toString().padStart(6, '0')}`,
            color: "text-blue-500"
          },
          { 
            label: "TIMESTAMP", 
            value: sessionDate ? new Date(sessionDate).toLocaleDateString() : 'N/A',
            color: "text-white/60"
          },
          { 
            label: "CORE_STATUS", 
            value: statusLabel.toUpperCase(),
            color: "text-emerald-500"
          }
        ]}
        actions={
          <div className="flex items-center gap-3 px-3">
             <div className="h-10 w-10 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-sm">
                <CommandLineIcon className="w-5 h-5 text-blue-500" />
             </div>
          </div>
        }
      />

      {/* 🛡️ OVERRIDE CONTROLLER (Sticky-like feel) */}
      <div className={`
        flex items-center justify-between px-6 py-4 border rounded-sm transition-all duration-700 backdrop-blur-md
        ${readOnly 
          ? "border-white/5 bg-white/[0.02]" 
          : "border-amber-500/30 bg-amber-500/[0.03] shadow-[0_0_30px_rgba(245,158,11,0.05)]"}
      `}>
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-full transition-colors duration-500 ${readOnly ? "bg-white/5" : "bg-amber-500/20"}`}>
            {readOnly ? (
              <LockClosedIcon className="w-5 h-5 text-white/20" />
            ) : (
              <PencilSquareIcon className="w-5 h-5 text-amber-500 animate-pulse" />
            )}
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${readOnly ? "text-white/40" : "text-amber-500"}`}>
              {readOnly ? "INTEGRITY_PROTECTION_ENABLED" : "SYSTEM_OVERRIDE_ACTIVE"}
            </span>
            <span className="text-[8px] font-mono opacity-30 uppercase tracking-widest">
              {readOnly ? "Read-only access: data persistence guaranteed" : "Warning: Manual history modification in progress"}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => setReadOnly(!readOnly)}
          className={`text-[9px] font-black px-6 py-2.5 border transition-all rounded-sm uppercase tracking-[0.2em] ${
            readOnly 
            ? "border-white/10 text-white/60 hover:border-blue-500/50 hover:text-blue-400" 
            : "border-amber-500/50 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 shadow-lg shadow-amber-500/10"
          }`}
        >
          {readOnly ? "Unlock_Data_Core" : "Commit_Modifications"}
        </button>
      </div>

      <div className="border border-white/10 bg-black/20 backdrop-blur-sm rounded-sm overflow-hidden shadow-2xl">
        <PatientHeader patient={transformToPatientHeader(appointment.patient)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar Táctico */}
        <div className="lg:col-span-3 space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-blue-500/50" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Clinical_Archive</span>
            </div>
            <DocumentsPanel
              patientId={appointment.patient.id}
              appointmentId={appointment.id}
              readOnly={readOnly}
            />
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <CommandLineIcon className="w-3.5 h-3.5 text-emerald-500/50" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Financial_Records</span>
            </div>
            <ChargeOrderPanel
              appointmentId={appointment.id}
              chargeOrder={appointment.charge_order}
              readOnly={readOnly}
            />
          </section>
        </div>

        {/* Main Workspace */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="bg-white/[0.01] border border-white/10 rounded-sm overflow-hidden">
            <ConsultationWorkflow
              diagnoses={appointment.diagnoses}
              appointmentId={appointment.id}
              notes={appointment.notes ?? null}
              readOnly={readOnly}
            />
          </div>

          <div className="p-6 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">
                    Data_Protocol_Export
                  </span>
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest mt-1">Output Interface // Medical Reporting Engine</span>
              </div>
              <div className="h-px flex-1 mx-8 bg-gradient-to-r from-white/10 to-transparent"></div>
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
