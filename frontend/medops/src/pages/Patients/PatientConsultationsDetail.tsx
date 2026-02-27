// src/pages/Patients/PatientConsultationsDetail.tsx
import { useParams, Link } from "react-router-dom";
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
import { apiFetch } from "../../api/client";
import { 
  LockClosedIcon, 
  LockOpenIcon,
  CommandLineIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { getPatient } from "../../api/patients";
import { toPatientHeaderPatient } from "../../utils/patientTransform";
export default function PatientConsultationsDetail() {
  const { patientId, appointmentId } = useParams<{ patientId: string; appointmentId: string }>();
  const appointmentIdNum = Number(appointmentId);
  
  const { data: appointment, isLoading, error } = useConsultationById(appointmentIdNum);
  
  // Estado para perfil completo del paciente
  const [patientProfile, setPatientProfile] = useState<any | null>(null);
  const [successData, setSuccessData] = useState<{ docs: any[], skipped: string[] } | null>(null);
  const [errorData, setErrorData] = useState<{ category: string, error: string }[] | null>(null);
  
  // Estado de solo lectura - automático según estado de la cita
  const isCompleted = appointment?.status === 'completed';
  const readOnly = isCompleted;
  // Cargar perfil completo del paciente
  useEffect(() => {
    if (appointment?.patient?.id) {
      getPatient(appointment.patient.id)
        .then((full) => setPatientProfile(full))
        .catch((e) => console.error("CRITICAL_PROFILE_LOAD_ERROR:", e));
    }
  }, [appointment?.patient?.id]);
  // Validación de IDs
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
  
  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-blue-500 animate-pulse">
          Initializing_Session_Link...
        </p>
      </div>
    </div>
  );
  
  if (error || !appointment) return (
    <div className="min-h-screen bg-black p-8">
      <div className="border border-red-500/30 bg-red-500/5 p-4 text-red-500 text-[10px] font-mono uppercase flex items-center gap-3">
        <ShieldCheckIcon className="w-4 h-4" />
        <div className="flex flex-col">
          <span>Critical_Error: Data_Stream_Corrupted</span>
          <span className="text-xs opacity-70">
            {error ? 'API call failed' : 'Consultation not found'} - 
            Appointment ID: {appointmentId}
          </span>
        </div>
      </div>
    </div>
  );
  // Datos seguros
  const safePatientId = Number(appointment?.patient?.id) || Number(patientId);
  const safeAppointmentId = Number(appointment?.id) || Number(appointmentId);
  
  const patient = patientProfile ? toPatientHeaderPatient(patientProfile) : null;
  const patientFullName = patient?.full_name || 
    appointment?.patient?.full_name || 
    `PATIENTE_${appointment?.patient?.id || 'UNKNOWN'}`;
  const sessionDate = appointment.appointment_date || "";
  const statusLabel = appointment.status_display || appointment.status || "N/A";
  // Función para navegar atrás
  const handleGoBack = () => {
    if (patientId) {
      window.location.href = `/patients/${patientId}`;
    } else {
      window.location.href = "/patients";
    }
  };
  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-6 space-y-6">
       
      {/* ✅ BREADCRUMBS SIMPLIFICADOS */}
      <div className="flex items-center gap-2 text-[10px] font-mono">
        <Link to="/" className="text-white/40 hover:text-white transition-colors">MEDOPZ</Link>
        <ChevronLeftIcon className="w-3 h-3 text-white/20" />
        <Link to="/patients" className="text-white/40 hover:text-white transition-colors">PATIENTS</Link>
        <ChevronLeftIcon className="w-3 h-3 text-white/20" />
        {patientId && (
          <>
            <Link to={`/patients/${patientId}`} className="text-white/40 hover:text-white transition-colors">
              {patientFullName.length > 20 ? patientFullName.substring(0, 20) + '...' : patientFullName}
            </Link>
            <ChevronLeftIcon className="w-3 h-3 text-white/20" />
          </>
        )}
        <span className="text-blue-400 font-bold">SUBJECT_ID_{String(appointment?.patient?.id || patientId || '').padStart(2, '0')}</span>
      </div>
      {/* ✅ HEADER SIMPLIFICADO - Solo stats funcionales */}
      <div className="flex items-center justify-between px-4 py-3 border border-white/10 bg-white/[0.02] rounded-sm">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">SESSION_NODE</span>
            <div className="text-[12px] font-bold text-blue-400">
              #{String(appointment?.id || appointmentId).padStart(6, '0')}
            </div>
          </div>
          <div>
            <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">TIMESTAMP</span>
            <div className="text-[11px] text-white/60">
              {sessionDate ? new Date(sessionDate).toLocaleDateString("es-VE", { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase() : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">CORE_STATUS</span>
            <div className="text-[11px] font-bold text-emerald-400 uppercase">
              {statusLabel}
            </div>
          </div>
        </div>
        
        {/* ✅ INDICADOR DE MODO */}
        <div className="flex items-center gap-3">
          {readOnly ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm">
              <LockClosedIcon className="w-4 h-4 text-white/40" />
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Read_Only</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-sm">
              <LockOpenIcon className="w-4 h-4 text-amber-400" />
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Edit_Mode</span>
            </div>
          )}
          
          <button 
            onClick={handleGoBack}
            className="flex items-center gap-2 px-4 py-2 text-[9px] font-bold uppercase tracking-wider text-white/40 hover:text-white border border-white/10 hover:border-white/30 transition-all rounded-sm"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>
      {/* ✅ PatientHeader - Solo muestra cuando hay datos */}
      <div className="relative overflow-hidden border border-white/10 bg-black/20 backdrop-blur-md p-1 shadow-2xl group">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-500" />
        {patient ? (
          <PatientHeader patient={patient} />
        ) : (
          <div className="p-6 text-center">
            <ShieldCheckIcon className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-amber-500">
              Loading_Patient_Data...
            </p>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <ShieldCheckIcon className="w-3.5 h-3.5 text-blue-500/50" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Clinical_Archive</span>
            </div>
            <DocumentsPanel
              patientId={appointment?.patient?.id || safePatientId}
              appointmentId={appointment?.id || safeAppointmentId}
              readOnly={readOnly}
            />
          </section>
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <CommandLineIcon className="w-3.5 h-3.5 text-emerald-500/50" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Financial_Records</span>
            </div>
            <ChargeOrderPanel
              appointmentId={appointment?.id || safeAppointmentId}
              readOnly={readOnly}
            />
          </section>
        </div>
        
        {/* Main Workspace */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="bg-white/[0.01] border border-white/10 rounded-sm overflow-hidden">
            <ConsultationWorkflow
              diagnoses={appointment?.diagnoses || []}
              appointmentId={appointment?.id || safeAppointmentId}
              readOnly={readOnly}
            />
          </div>
          
          {/* ✅ BOTÓN EXPORT ARREGLADO - Colores legibles */}
          <div className="p-6 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em]">
                  Medical_Report_Export
                </span>
                <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest mt-1">Output Interface</span>
              </div>
              <div className="h-px flex-1 mx-8 bg-gradient-to-r from-white/10 to-transparent"></div>
            </div>
            <ConsultationDocumentsActions 
              consultationId={appointment?.id || safeAppointmentId} 
              patientId={appointment?.patient?.id || Number(patientId)}
            />
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