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
// 🆕 IMPORTACIONES CRÍTICAS PARA EL FUNCIONAMIENTO PERFECTO
import { getPatient } from "../../api/patients";
import { toPatientHeaderPatient } from "../../utils/patientTransform";
export default function PatientConsultationsDetail() {
  const { patientId, appointmentId } = useParams<{ patientId: string; appointmentId: string }>();
  const appointmentIdNum = Number(appointmentId);
  
  // 🔧 MEJORADO: Eliminado "as any" para mejor manejo de TypeScript
  const { data: appointment, isLoading, error } = useConsultationById(appointmentIdNum);
  
  // 🆕 ESTADO PARA PERFIL COMPLETO DEL PACIENTE
  const [patientProfile, setPatientProfile] = useState<any | null>(null);
  const [successData, setSuccessData] = useState<{ docs: any[], skipped: string[] } | null>(null);
  const [errorData, setErrorData] = useState<{ category: string, error: string }[] | null>(null);
  const [readOnly, setReadOnly] = useState<boolean>(() => {
    const saved = localStorage.getItem("consultationReadOnly");
    return saved ? JSON.parse(saved) : true;
  });
  
  // 🆕 EFECTO PARA CARGAR PERFIL COMPLETO DEL PACIENTE
  useEffect(() => {
    if (appointment?.patient?.id) {
      getPatient(appointment.patient.id)
        .then((full) => setPatientProfile(full))
        .catch((e) => console.error("CRITICAL_PROFILE_LOAD_ERROR:", e));
    }
  }, [appointment?.patient?.id]);
  
  useEffect(() => {
    localStorage.setItem("consultationReadOnly", JSON.stringify(readOnly));
  }, [readOnly]);
  
  // 🔧 MEJORADO: Validación de IDs
  if (!appointmentId || isNaN(appointmentIdNum)) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="border border-amber-500/30 bg-amber-500/5 p-4 text-amber-500 text-[10px] font-mono uppercase flex items-center gap-3">
          <ShieldCheckIcon className="w-4 h-4" />
          <div className="flex flex-col">
            <span>Invalid_Appointment_ID</span>
            <span className="text-xs opacity-70">Please check the consultation link</span>
          </div>
        </div>
      </div>
    );
  }
  
  // 🆕 ESTADO COMBINADO DE CARGA
  const isDataLoading = isLoading || !patientProfile;
  const hasError = error || !appointment;
  
  if (isDataLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-blue-500 animate-pulse">
          {isLoading ? "Initializing_Session_Link..." : "Loading_Patient_Profile..."}
        </p>
      </div>
    </div>
  );
  
  if (hasError) return (
    <div className="min-h-screen bg-black p-8">
      <div className="border border-red-500/30 bg-red-500/5 p-4 text-red-500 text-[10px] font-mono uppercase flex items-center gap-3">
        <ShieldCheckIcon className="w-4 h-4" />
        <div className="flex flex-col">
          <span>Critical_Error: Data_Stream_Corrupted</span>
          <span className="text-xs opacity-70">Access_Denied - Consultation not found or API failure</span>
        </div>
      </div>
    </div>
  );
  
  // 🔧 VALIDACIÓN DE CONSISTENCIA
  if (appointment?.patient?.id !== patientProfile?.id) {
    console.warn("Patient ID mismatch between appointment and profile");
  }
  
  // 🆕 MANEJO ROBUSTO DEL PACIENTE
  const patient = patientProfile ? toPatientHeaderPatient(patientProfile) : null;
  const patientFullName = patient?.full_name || "SUBJECT_NAME_UNDEFINED";
  const sessionDate = appointment.appointment_date || "";
  const statusLabel = appointment.status_display || appointment.status || "N/A";
  
  // 🔧 MEJORADO: Validación final antes del renderizado
  if (!patient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShieldCheckIcon className="w-10 h-10 text-amber-500 mx-auto" />
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-amber-500">
            Patient_Profile_Unavailable
          </p>
          <p className="text-[8px] font-mono text-amber-400/70">
            Unable to load complete patient information
          </p>
        </div>
      </div>
    );
  }
  
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
      
      {/* 🔧 MEJORADO: PatientHeader con perfil completo */}
      <div className="border border-white/10 bg-black/20 backdrop-blur-sm rounded-sm overflow-hidden shadow-2xl">
        <PatientHeader patient={patient} />
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
              patientId={patient.id || appointment.patient.id}
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