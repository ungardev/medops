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
  
  const [patientProfile, setPatientProfile] = useState<any | null>(null);
  const [successData, setSuccessData] = useState<{ docs: any[], skipped: string[] } | null>(null);
  const [errorData, setErrorData] = useState<{ category: string, error: string }[] | null>(null);
  
  const [isEditMode, setIsEditMode] = useState(false);
  
  const isCompleted = appointment?.status === 'completed';
  const readOnly = isCompleted || !isEditMode;
  
  useEffect(() => {
    if (appointment?.patient?.id) {
      getPatient(appointment.patient.id)
        .then((full) => setPatientProfile(full))
        .catch((e) => console.error("Error loading profile:", e));
    }
  }, [appointment?.patient?.id]);
  if (!appointmentId || isNaN(appointmentIdNum)) {
    return (
      <div className="min-h-screen bg-black p-8">
        <div className="border border-amber-500/20 bg-amber-500/5 p-4 text-amber-400 text-[10px] font-medium flex items-center gap-3 rounded-lg">
          <ShieldCheckIcon className="w-4 h-4" />
          <div className="flex flex-col">
            <span>ID de consulta inválido</span>
            <span className="text-xs opacity-70">Por favor verifica el enlace de consulta</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin mx-auto" />
        <p className="text-[10px] text-emerald-400/60">
          Cargando consulta...
        </p>
      </div>
    </div>
  );
  
  if (error || !appointment) return (
    <div className="min-h-screen bg-black p-8">
      <div className="border border-red-500/20 bg-red-500/5 p-4 text-red-400 text-[10px] font-medium flex items-center gap-3 rounded-lg">
        <ShieldCheckIcon className="w-4 h-4" />
        <div className="flex flex-col">
          <span>Error al cargar los datos</span>
          <span className="text-xs opacity-70">
            {error ? 'Error en la llamada API' : 'Consulta no encontrada'} - 
            ID: {appointmentId}
          </span>
        </div>
      </div>
    </div>
  );
  const safePatientId = Number(appointment?.patient?.id) || Number(patientId);
  const safeAppointmentId = Number(appointment?.id) || Number(appointmentId);
  
  const patient = patientProfile ? toPatientHeaderPatient(patientProfile) : null;
  const patientFullName = patient?.full_name || 
    appointment?.patient?.full_name || 
    `Paciente ${appointment?.patient?.id || 'Desconocido'}`;
  const statusLabel = appointment.status_display || appointment.status || "N/A";
  const handleGoBack = () => {
    if (patientId) {
      window.location.href = `/patients/${patientId}`;
    } else {
      window.location.href = "/patients";
    }
  };
  return (
    <div className="min-h-screen bg-black text-white p-4 space-y-4">
      
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "Pacientes", path: "/patients" },
          { label: patientFullName.length > 20 ? patientFullName.substring(0, 20) + '...' : patientFullName, path: `/patients/${patientId}` },
          { label: "Detalle de Consulta", active: true }
        ]}
        stats={[
          { 
            label: "Consulta", 
            value: `#${String(appointment?.id || appointmentId).padStart(6, '0')}`,
            color: "text-white/60"
          },
          { 
            label: "Estado", 
            value: statusLabel,
            color: "text-emerald-400"
          }
        ]}
        children={
          <div className="flex items-center gap-3">
            {patient ? <PatientHeader patient={patient} /> : null}
            
            <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/15">
              {isCompleted ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/15 rounded-lg">
                  <LockClosedIcon className="w-4 h-4 text-white/30" />
                  <span className="text-[9px] font-medium text-white/40">Completada</span>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-all ${
                    isEditMode 
                      ? "bg-amber-500/10 border-amber-500/20" 
                      : "bg-white/5 border-white/15"
                  }`}
                >
                  <LockOpenIcon className={`w-4 h-4 ${isEditMode ? "text-amber-400" : "text-white/30"}`} />
                  <span className={`text-[9px] font-medium uppercase ${isEditMode ? "text-amber-400" : "text-white/40"}`}>
                    {isEditMode ? "Editar" : "Solo lectura"}
                  </span>
                </button>
              )}
              
              <button 
                onClick={handleGoBack}
                className="flex items-center gap-2 px-3 py-1.5 text-[9px] font-medium text-white/40 hover:text-white/70 border border-white/15 hover:border-white/25 transition-all rounded-lg"
              >
                <ChevronLeftIcon className="w-3 h-3" />
                Volver
              </button>
            </div>
          </div>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 px-4">
        
        <main className="lg:col-span-9 space-y-4">
          <div className="bg-white/5 border border-white/15 p-1 relative min-h-[500px] flex flex-col rounded-lg">
            <div className="flex-1 bg-black/10 p-4 rounded-lg">
              <ConsultationWorkflow
                diagnoses={appointment?.diagnoses || []}
                appointmentId={appointment?.id || safeAppointmentId}
                readOnly={readOnly}
              />
            </div>
            
            <footer className="border-t border-white/10 bg-black/20 p-3 flex flex-wrap items-center justify-between gap-2 rounded-b-lg">
              <div className="flex flex-wrap gap-2">
                <ConsultationDocumentsActions 
                  consultationId={appointment?.id || safeAppointmentId} 
                  patientId={appointment?.patient?.id || Number(patientId)}
                />
              </div>
            </footer>
          </div>
        </main>
        
        <aside className="lg:col-span-3 space-y-4">
          <CollapsiblePanel title="Documentos Clínicos">
            <DocumentsPanel
              patientId={appointment?.patient?.id || safePatientId}
              appointmentId={appointment?.id || safeAppointmentId}
              readOnly={readOnly}
            />
          </CollapsiblePanel>
          <CollapsiblePanel title="Registros Financieros">
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