// src/pages/PatientPortal/PatientQueue.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePatientWaitingRoom } from "@/hooks/patients/usePatientWaitingRoom";
import { useMedicalServices } from "@/hooks/services/useMedicalServices";
import PageHeader from "@/components/Common/PageHeader";
import { 
  ClockIcon, 
  CheckCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
  ArrowUpIcon,
  BellAlertIcon,
  ClipboardDocumentIcon
} from "@heroicons/react/24/outline";
const renderStatusBadge = (status: string, isPatient: boolean = false) => {
  const base = "inline-flex items-center justify-center px-2 py-0.5 text-[8px] rounded-sm font-black uppercase tracking-wider border whitespace-nowrap";
  
  if (isPatient && status === "waiting") {
    return (
      <span className={`${base} bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)] animate-pulse`}>
        TU TURNO
      </span>
    );
  }
  
  switch (status) {
    case "waiting":
      return <span className={`${base} bg-amber-500/20 text-amber-400 border-amber-500/40`}>EN_ESPERA</span>;
    case "in_consultation":
      return <span className={`${base} bg-white/20 text-white border-white/40 animate-pulse`}>EN_CONSULTA</span>;
    case "completed":
      return <span className={`${base} bg-emerald-500/20 text-emerald-400 border-emerald-500/40`}>ATENDIDO</span>;
    default:
      return <span className={`${base} bg-white/5 text-white/40 border-white/10`}>{status.toUpperCase()}</span>;
  }
};
const renderWaitTime = (entry: any) => {
  if (entry.status === "completed") {
    return (
      <div className="flex items-center gap-1 font-mono text-[9px] text-emerald-500/60 uppercase">
        <CheckCircleIcon className="w-3 h-3" />
        <span>Sesión_Finalizada</span>
      </div>
    );
  }
  
  if (!entry.arrival_time) return <span className="text-white/30">--</span>;
  
  const minutes = Math.floor((Date.now() - new Date(entry.arrival_time).getTime()) / 60000);
  return (
    <div className="flex items-center gap-1 font-mono text-[10px] text-amber-500/70">
      <ClockIcon className="w-3 h-3" />
      <span>{minutes < 60 ? `${minutes}m` : `${Math.floor(minutes/60)}h ${minutes%60}m`}</span>
    </div>
  );
};
export default function PatientQueue() {
  const navigate = useNavigate();
  const storedPatientId = localStorage.getItem("patient_id");
  
  // Obtener lista de servicios para mapeo
  const { data: medicalServices, isLoading: servicesLoading } = useMedicalServices();
  
  useEffect(() => {
    if (!storedPatientId) {
      navigate("/patient/login");
    }
  }, [navigate, storedPatientId]);
  
  if (!storedPatientId) return null;
  
  const patientId = Number(storedPatientId);
  const { 
    allEntries, 
    patientEntry, 
    patientsAhead, 
    waitingCount, 
    inConsultationCount, 
    completedCount 
  } = usePatientWaitingRoom();
  
  const isLoading = false;
  
  // Función para obtener nombre del servicio
  const getServiceName = (serviceId?: number) => {
    if (!serviceId || !medicalServices) return null;
    const service = medicalServices.find(s => s.id === serviceId);
    return service?.name || null;
  };
  if (isLoading || servicesLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-blue-500">Syncing_Queue_Data...</p>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      {/* HEADER */}
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "SALA DE ESPERA", active: true }
        ]}
        stats={[
          { 
            label: "En_Espera", 
            value: waitingCount, 
            color: "text-amber-500" 
          },
          { 
            label: "En_Consulta", 
            value: inConsultationCount, 
            color: "text-white" 
          },
          { 
            label: "Atendidos", 
            value: completedCount, 
            color: "text-emerald-500" 
          }
        ]}
        actions={
          <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/5 shadow-inner">
            <ClockIcon className="w-5 h-5 text-blue-500" />
          </div>
        }
      />
      
      {/* PACIENTE ACTUAL DESTACADO */}
      {patientEntry && (
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-sm bg-cyan-500/20 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider">Tu Estado</p>
                <p className="text-lg font-black text-white uppercase">
                  {patientEntry.status === "waiting" && `En Espera - Posición #${patientEntry.order}`}
                  {patientEntry.status === "in_consultation" && "En Consulta"}
                  {patientEntry.status === "completed" && "Atendido"}
                </p>
                {/* NUEVO: Mostrar servicio del paciente actual */}
                {patientEntry.serviceId && (
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-300 mt-1">
                    <ClipboardDocumentIcon className="w-3 h-3" />
                    <span>{getServiceName(patientEntry.serviceId) || "Servicio No Identificado"}</span>
                  </div>
                )}
                {patientEntry.status === "waiting" && patientsAhead > 0 && (
                  <p className="text-[10px] text-white/60">
                    {patientsAhead} paciente{patientsAhead !== 1 ? 's' : ''} antes que tú
                  </p>
                )}
                {patientEntry.status === "waiting" && patientsAhead === 0 && (
                  <p className="text-[10px] text-cyan-400 font-bold animate-pulse">
                    ¡Eres el siguiente!
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {renderStatusBadge(patientEntry.status, true)}
              {renderWaitTime(patientEntry)}
            </div>
          </div>
        </div>
      )}
      
      {/* MENSAJE SI NO ESTÁ EN LA COLA */}
      {!patientEntry && waitingCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-sm p-4">
          <div className="flex items-center gap-3">
            <BellAlertIcon className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-[10px] font-bold text-amber-400 uppercase">No tienes turno activo</p>
              <p className="text-[9px] text-white/60">Tienes {waitingCount} paciente{waitingCount !== 1 ? 's' : ''} en espera. Tu turno aparecerá cuando el doctor te llame.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* LISTA COMPLETA DE LA COLA */}
      <div className="bg-[#0a0a0b] border border-white/10 rounded-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
            Cola_de_Espera_Hoy
          </h3>
        </div>
        {allEntries.length === 0 ? (
          <div className="p-20 text-center opacity-30">
            <p className="text-[11px] font-mono uppercase tracking-widest">No hay pacientes en espera</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {allEntries.map((entry, index) => {
              const isCurrentPatient = entry.patient?.id === patientId;
              const serviceName = getServiceName(entry.serviceId);
              
              return (
                <div 
                  key={entry.id}
                  className={`flex justify-between items-center px-4 py-4 transition-colors ${
                    isCurrentPatient 
                      ? "bg-cyan-500/5 border-l-4 border-cyan-500" 
                      : "hover:bg-white/[0.02] border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <span className={`font-mono text-xs font-bold ${
                      isCurrentPatient ? "text-cyan-400" : "text-white/30"
                    }`}>
                      {String(index + 1).padStart(2, '0')}.
                    </span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] font-black uppercase ${
                          isCurrentPatient ? "text-cyan-400" : "text-white"
                        }`}>
                          {entry.patient?.full_name || "Paciente"}
                          {isCurrentPatient && <span className="text-cyan-400/60 text-[10px] ml-2">(TÚ)</span>}
                        </span>
                        {renderStatusBadge(entry.status, isCurrentPatient)}
                      </div>
                      
                      {/* NUEVO: Mostrar servicio */}
                      {serviceName && (
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-blue-400/80">
                          <ClipboardDocumentIcon className="w-3 h-3" />
                          <span>{serviceName}</span>
                        </div>
                      )}
                      
                      {entry.institution_data && (
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-white/60">
                          <BuildingOfficeIcon className="w-3 h-3 text-blue-500/50" />
                          <span>{entry.institution_data.name}</span>
                        </div>
                      )}
                      
                      {renderWaitTime(entry)}
                    </div>
                  </div>
                  
                  {/* Indicador de posición del paciente */}
                  {entry.status === "waiting" && !isCurrentPatient && (
                    <div className="text-[9px] font-mono text-white/30">
                      #{entry.order}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}