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
import PageHeader from "../../components/Common/PageHeader";
import CollapsiblePanel from "../../components/Common/CollapsiblePanel";
import { apiFetch } from "../../api/client";
import { 
  LockClosedIcon, 
  LockOpenIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
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
  
  // ✅ ESTADO LOCAL PARA MODO EDICIÓN
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Lógica de solo lectura actualizada
  const isCompleted = appointment?.status === 'completed';
  const readOnly = isCompleted || !isEditMode; // Solo editable si NO está completada Y está en modo edición
  
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
    <div className="min-h-screen bg-black text-white p-4 space-y-4">
      
      {/* ✅ PAGE HEADER (Estilo Consultation.tsx + Switch Estado Dinámico) */}
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "PATIENTS", path: "/patients" },
          { label: patientFullName.length > 20 ? patientFullName.substring(0, 20) + '...' : patientFullName, path: `/patients/${patientId}` },
          { label: "CONSULTATION_DETAIL", active: true }
        ]}
        stats={[
          { 
            label: "SESSION_NODE", 
            value: `#${String(appointment?.id || appointmentId).padStart(6, '0')}`,
            color: "text-blue-500"
          },
          { 
            label: "CORE_STATUS", 
            value: statusLabel.toUpperCase(),
            color: "text-emerald-400 font-bold"
          }
        ]}
        children={
          <div className="flex items-center gap-3">
            {/* Patient Header (alineado a la derecha) */}
            {patient ? <PatientHeader patient={patient} /> : null}
            
            {/* Switch Estado (Read Only / Edit Mode) - Dinámico */}
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
              {isCompleted ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm">
                  <LockClosedIcon className="w-4 h-4 text-white/40" />
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Completed</span>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center gap-2 px-3 py-1.5 border rounded-sm transition-all ${
                    isEditMode 
                      ? "bg-amber-500/10 border-amber-500/30" 
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <LockOpenIcon className={`w-4 h-4 ${isEditMode ? "text-amber-400" : "text-white/40"}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-wider ${isEditMode ? "text-amber-400" : "text-white/40"}`}>
                    {isEditMode ? "Edit_Mode" : "Read_Only"}
                  </span>
                </button>
              )}
              
              {/* Botón Back (integrado en el header) */}
              <button 
                onClick={handleGoBack}
                className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white/40 hover:text-white border border-white/10 hover:border-white/30 transition-all rounded-sm"
              >
                <ChevronLeftIcon className="w-3 h-3" />
                Back
              </button>
            </div>
          </div>
        }
      />
      
      {/* ✅ Layout Principal Compacto (Estilo Consultation.tsx) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-4">
        
        {/* Main (Workflow) - Izquierda (9 columnas) */}
        <main className="lg:col-span-9 space-y-4">
          <div className="bg-black/20 border border-white/10 p-1 relative min-h-[500px] flex flex-col shadow-2xl">
            <div className="flex-1 bg-black/10 p-4">
              <ConsultationWorkflow
                diagnoses={appointment?.diagnoses || []}
                appointmentId={appointment?.id || safeAppointmentId}
                readOnly={readOnly}
              />
            </div>
            
            {/* Footer con Botones de Acción */}
            <footer className="border-t border-white/10 bg-black/40 p-3 flex flex-wrap items-center justify-between gap-2 backdrop-blur-md">
              <div className="flex flex-wrap gap-2">
                <ConsultationDocumentsActions 
                  consultationId={appointment?.id || safeAppointmentId} 
                  patientId={appointment?.patient?.id || Number(patientId)}
                />
              </div>
            </footer>
          </div>
        </main>
        
        {/* Aside (Docs/Charges) - Derecha (3 columnas) */}
        <aside className="lg:col-span-3 space-y-4">
          <CollapsiblePanel title="Clinical_Documents">
            <DocumentsPanel
              patientId={appointment?.patient?.id || safePatientId}
              appointmentId={appointment?.id || safeAppointmentId}
              readOnly={readOnly}
            />
          </CollapsiblePanel>
          <CollapsiblePanel title="Financial_Records">
            <ChargeOrderPanel
              appointmentId={appointment?.id || safeAppointmentId}
              readOnly={readOnly}
            />
          </CollapsiblePanel>
        </aside>
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