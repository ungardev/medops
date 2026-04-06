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
  ClipboardDocumentIcon,
  EyeSlashIcon
} from "@heroicons/react/24/outline";
const renderStatusBadge = (status: string, isPatient: boolean = false) => {
  const base = "inline-flex items-center justify-center px-2.5 py-1 text-[9px] rounded-md font-medium border whitespace-nowrap";
  
  if (isPatient && status === "waiting") {
    return (
      <span className={`${base} bg-cyan-500/10 text-cyan-400 border-cyan-500/20`}>
        Tu Turno
      </span>
    );
  }
  
  switch (status) {
    case "waiting":
      return <span className={`${base} bg-amber-500/10 text-amber-400 border-amber-500/20`}>En Espera</span>;
    case "in_consultation":
      return <span className={`${base} bg-white/10 text-white/80 border-white/20`}>En Consulta</span>;
    case "completed":
      return <span className={`${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>Atendido</span>;
    default:
      return <span className={`${base} bg-white/5 text-white/40 border-white/10`}>{status}</span>;
  }
};
const renderWaitTime = (entry: any) => {
  if (entry.status === "completed") {
    return (
      <div className="flex items-center gap-1 text-[9px] text-emerald-400/60">
        <CheckCircleIcon className="w-3.5 h-3.5" />
        <span>Sesión finalizada</span>
      </div>
    );
  }
  
  if (!entry.arrival_time) return <span className="text-white/20">--</span>;
  
  const minutes = Math.floor((Date.now() - new Date(entry.arrival_time).getTime()) / 60000);
  return (
    <div className="flex items-center gap-1 text-[10px] text-amber-400/50">
      <ClockIcon className="w-3.5 h-3.5" />
      <span>{minutes < 60 ? `${minutes}m` : `${Math.floor(minutes/60)}h ${minutes%60}m`}</span>
    </div>
  );
};
export default function PatientQueue() {
  const navigate = useNavigate();
  const storedPatientId = localStorage.getItem("patient_id");
  
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
  
  const getServiceName = (serviceId?: number) => {
    if (!serviceId || !medicalServices) return null;
    const service = medicalServices.find(s => s.id === serviceId);
    return service?.name || null;
  };
  if (isLoading || servicesLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
        <p className="text-[10px] text-emerald-400/60">Cargando datos de la cola...</p>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "Sala de Espera", active: true }
        ]}
        stats={[
          { label: "En Espera", value: waitingCount, color: "text-amber-400" },
          { label: "En Consulta", value: inConsultationCount, color: "text-white/70" },
          { label: "Atendidos", value: completedCount, color: "text-emerald-400" }
        ]}
        actions={
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5">
            <ClockIcon className="w-5 h-5 text-white/30" />
          </div>
        }
      />
      
      {/* Tu Turno - Solo si el paciente tiene entrada activa */}
      {patientEntry && (
        <div className="bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-cyan-400/70" />
              </div>
              <div>
                <p className="text-[9px] text-cyan-400/60 mb-0.5">Tu Estado</p>
                <p className="text-lg font-medium text-white/90">
                  {patientEntry.status === "waiting" && `En Espera - Posición #${patientEntry.order}`}
                  {patientEntry.status === "in_consultation" && "En Consulta"}
                  {patientEntry.status === "completed" && "Atendido"}
                </p>
                {patientEntry.serviceId && (
                  <div className="flex items-center gap-1.5 text-[9px] text-cyan-400/70 mt-1">
                    <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                    <span>{getServiceName(patientEntry.serviceId) || "Servicio no identificado"}</span>
                  </div>
                )}
                {patientEntry.status === "waiting" && patientsAhead > 0 && (
                  <p className="text-[10px] text-white/40 mt-0.5">
                    {patientsAhead} paciente{patientsAhead !== 1 ? 's' : ''} antes que tú
                  </p>
                )}
                {patientEntry.status === "waiting" && patientsAhead === 0 && (
                  <p className="text-[10px] text-cyan-400/80 mt-0.5">
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
      
      {/* FIX CRÍTICO: Si no tiene turno activo, NO mostrar la cola */}
      {!patientEntry && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <BellAlertIcon className="w-6 h-6 text-amber-400/70" />
            </div>
            <div>
              <p className="text-[12px] font-medium text-amber-400 mb-1">No tienes turno activo</p>
              <p className="text-[10px] text-white/40">
                No estás registrado en la sala de espera. Tu turno aparecerá aquí cuando el doctor registre tu llegada.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Cola de Espera - SOLO si el paciente tiene turno activo */}
      {patientEntry && allEntries.length > 0 && (
        <div className="bg-white/5 border border-white/15 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <h3 className="text-[11px] font-medium text-white/60">
              Cola de Espera
            </h3>
            <div className="flex items-center gap-1.5 text-[9px] text-white/30">
              <EyeSlashIcon className="w-3.5 h-3.5" />
              <span>Nombres protegidos por confidencialidad</span>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {allEntries.map((entry, index) => {
              const isCurrentPatient = entry.patient?.id === patientId;
              const serviceName = getServiceName(entry.serviceId);
              
              return (
                <div 
                  key={entry.id}
                  className={`flex justify-between items-center px-5 py-4 transition-colors ${
                    isCurrentPatient 
                      ? "bg-cyan-500/5 border-l-4 border-cyan-500/30" 
                      : "hover:bg-white/5 border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1">
                    <span className={`font-mono text-xs font-medium ${
                      isCurrentPatient ? "text-cyan-400/70" : "text-white/20"
                    }`}>
                      {String(index + 1).padStart(2, '0')}.
                    </span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] font-medium ${
                          isCurrentPatient ? "text-cyan-400/90" : "text-white/40"
                        }`}>
                          {isCurrentPatient 
                            ? `${entry.patient?.full_name || "Tú"} (TÚ)`
                            : `Paciente #${index + 1}`
                          }
                        </span>
                        {renderStatusBadge(entry.status, isCurrentPatient)}
                      </div>
                      
                      {serviceName && (
                        <div className="flex items-center gap-1.5 text-[9px] text-blue-400/60">
                          <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                          <span>{serviceName}</span>
                        </div>
                      )}
                      
                      {entry.institution_data && (
                        <div className="flex items-center gap-1.5 text-[9px] text-white/30">
                          <BuildingOfficeIcon className="w-3.5 h-3.5" />
                          <span>{entry.institution_data.name}</span>
                        </div>
                      )}
                      
                      {renderWaitTime(entry)}
                    </div>
                  </div>
                  
                  {entry.status === "waiting" && !isCurrentPatient && (
                    <div className="text-[9px] font-mono text-white/20">
                      #{entry.order}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}