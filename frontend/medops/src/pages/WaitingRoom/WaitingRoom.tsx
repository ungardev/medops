// src/pages/WaitingRoom.tsx
import { useState, useEffect } from "react";
import RegisterWalkinModal from "../../components/WaitingRoom/RegisterWalkinModal";
import ConfirmCloseDayModal from "../../components/WaitingRoom/ConfirmCloseDayModal";
import ConfirmGenericModal from "../../components/Common/ConfirmGenericModal";
import Toast from "../../components/Common/Toast";

import { useWaitingRoomEntriesToday } from "../../hooks/waitingroom/useWaitingRoomEntriesToday";
import { useUpdateWaitingRoomStatus } from "../../hooks/waitingroom/useUpdateWaitingRoomStatus";
import { useRegisterArrival } from "../../hooks/waitingroom/useRegisterArrival";
import { useUpdateAppointmentStatus } from "../../hooks/appointments/useUpdateAppointmentStatus";

import type { WaitingRoomEntry, WaitingRoomStatus } from "../../types/waitingRoom";
import type { Appointment } from "../../types/appointments";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  PlayIcon, 
  XMarkIcon, 
  PlusIcon, 
  PowerIcon, 
  ClockIcon, 
  UserGroupIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

const renderStatusBadge = (status: string) => {
  const base = "inline-flex items-center justify-center px-2 py-0.5 text-[9px] rounded-sm font-black uppercase tracking-tighter border whitespace-nowrap transition-all";

  switch (status) {
    case "waiting":
      return <span className={`${base} bg-amber-500/5 text-amber-500 border-amber-500/20`}>In_Queue</span>;
    case "in_consultation":
      return <span className={`${base} bg-[var(--palantir-active)]/10 text-[var(--palantir-active)] border-[var(--palantir-active)]/30 animate-pulse`}>In_Consult</span>;
    case "completed":
      return <span className={`${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]`}>Resolved</span>;
    case "canceled":
      return <span className={`${base} bg-red-500/5 text-red-500 border-red-500/20`}>Aborted</span>;
    default:
      return <span className={`${base} bg-white/5 text-white/40 border-white/10`}>{status}</span>;
  }
};

const renderWaitTime = (entry: WaitingRoomEntry) => {
  if (!entry.arrival_time) return "-";
  
  if (entry.status === 'completed') {
    return (
      <div className="flex items-center gap-1 font-mono text-[9px] text-emerald-500/40 uppercase tracking-tighter">
        <CheckCircleIcon className="w-3 h-3" />
        <span>Cycle_Ended</span>
      </div>
    );
  }

  const minutes = Math.floor((Date.now() - new Date(entry.arrival_time).getTime()) / 60000);
  return (
    <div className="flex items-center gap-1 font-mono text-[10px] text-white/20">
      <ClockIcon className="w-3 h-3 text-amber-500/50" />
      <span>{minutes < 60 ? `${minutes}M` : `${Math.floor(minutes / 60)}H ${minutes % 60}M`}</span>
    </div>
  );
};

export default function WaitingRoom() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [entryToCancel, setEntryToCancel] = useState<WaitingRoomEntry | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const { data: entries, isLoading, isFetching } = useWaitingRoomEntriesToday();
  const updateWaitingRoomStatus = useUpdateWaitingRoomStatus();
  const updateAppointmentStatus = useUpdateAppointmentStatus();
  const registerArrival = useRegisterArrival();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split("T")[0];

  const { data: appointmentsToday } = useQuery({
    queryKey: ["appointmentsToday", today],
    queryFn: async (): Promise<Appointment[]> => {
      const res = await fetch(`/api/appointments/?date=${today}&status__in=pending,canceled`);
      if (res.status === 204) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30000,
    initialData: [],
  });

  const orderedGroup = (entries ?? []).filter((e) =>
    ["waiting", "in_consultation", "completed"].includes(e.status)
  );

  const pendingAppointmentsToday = (appointmentsToday ?? []).filter((a) =>
    ["pending", "canceled"].includes(a.status)
  );

  const [showOverlay, setShowOverlay] = useState(true);
  useEffect(() => {
    if (!isLoading && !isFetching) {
      const timeout = setTimeout(() => setShowOverlay(false), 400);
      return () => clearTimeout(timeout);
    } else {
      setShowOverlay(true);
    }
  }, [isLoading, isFetching]);

  const handleStatusChange = (entry: WaitingRoomEntry, newStatus: WaitingRoomStatus) => {
    if (entry.appointment_id) {
      updateAppointmentStatus.mutate({ id: entry.appointment_id, status: newStatus });
    } else {
      updateWaitingRoomStatus.mutate({ id: Number(entry.id), status: newStatus });
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-8 relative min-h-screen">
      
      {/* HEADER TÉCNICO CON BREADCRUMBS Y ACCIONES */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.05] pb-8">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 mb-3">
            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">MedOps</span>
            <span className="text-[8px] text-white/10">/</span>
            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">Ops_Central</span>
            <span className="text-[8px] text-white/10">/</span>
            <span className="text-[8px] font-black text-[var(--palantir-active)] uppercase tracking-[0.3em]">Waiting_Room</span>
          </nav>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
            Gestión_Sala
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/10 rounded-sm">LIVE_STREAM</span>
          </h1>
          
          <div className="flex gap-8 mt-6">
            {[
              { label: "En Espera", value: orderedGroup.filter(e => e.status === 'waiting').length, color: "text-amber-500" },
              { label: "En Consulta", value: orderedGroup.filter(e => e.status === 'in_consultation').length, color: "text-[var(--palantir-active)]" },
              { label: "Finalizados", value: orderedGroup.filter(e => e.status === 'completed').length, color: "text-emerald-500" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col border-l border-white/5 pl-4 first:border-0 first:pl-0">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">{stat.label}</span>
                <span className={`text-xl font-black font-mono leading-none ${stat.color}`}>
                  {stat.value.toString().padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfirmClose(true)}
            className="px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] border border-red-500/20 text-red-500/60 rounded-sm hover:bg-red-500/5 transition-all flex items-center gap-2"
          >
            <PowerIcon className="w-3.5 h-3.5" />
            Abortar_Jornada
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] bg-[var(--palantir-active)] text-white rounded-sm hover:brightness-110 shadow-[0_0_20px_rgba(var(--palantir-active-rgb),0.2)] flex items-center gap-2 transition-all"
          >
            <PlusIcon className="w-3.5 h-3.5 stroke-[3px]" />
            Registrar_Llegada
          </button>
        </div>
      </div>

      {showOverlay && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 animate-in fade-in duration-500">
           <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-1 bg-white/5 overflow-hidden rounded-full">
                <div className="w-1/2 h-full bg-[var(--palantir-active)] animate-infinite-loading" />
              </div>
              <span className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/40">Syncing_Queue...</span>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* PANEL PRINCIPAL: LIVE QUEUE */}
        <div className="lg:col-span-8 flex flex-col bg-[#0c0e12] border border-white/[0.05] rounded-sm overflow-hidden shadow-2xl">
          <div className="px-5 py-3 border-b border-white/[0.05] bg-white/[0.02] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <UserGroupIcon className="w-4 h-4 text-[var(--palantir-active)]" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Buffer_De_Atención_Activo</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[8px] font-mono text-white/10 uppercase tracking-widest">Link_Status: Encrypted</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
          </div>

          <div className="min-h-[500px]">
            {orderedGroup.length === 0 ? (
              <div className="h-[500px] flex flex-col items-center justify-center space-y-4 opacity-20">
                <ClockIcon className="w-8 h-8 stroke-1" />
                <p className="text-[10px] font-mono uppercase tracking-[0.5em]">Null_Stream_Data</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {orderedGroup.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className={`group flex justify-between items-center px-6 py-5 transition-all border-l-2 ${
                      entry.status === 'completed' 
                        ? 'bg-emerald-500/[0.01] border-emerald-500/20 opacity-60' 
                        : 'hover:bg-white/[0.01] border-transparent hover:border-l-[var(--palantir-active)]'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                      <span className="font-mono text-[10px] font-black text-white/10 group-hover:text-[var(--palantir-active)] transition-colors">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      
                      <div className="flex flex-col gap-1">
                        <p className={`text-sm font-black uppercase tracking-tight ${entry.status === 'completed' ? 'text-white/40' : 'text-white/90'}`}>
                          {entry.patient.full_name}
                        </p>
                        <div className="flex items-center gap-4">
                           {renderWaitTime(entry)}
                           <span className="text-[8px] font-mono text-white/5 uppercase tracking-widest">Entry_ID: {entry.id.toString().padStart(4, '0')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      {renderStatusBadge(entry.status)}
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {entry.status === 'waiting' && (
                          <button 
                            onClick={() => handleStatusChange(entry, "in_consultation")}
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-sm transition-all"
                            title="Iniciar Consulta"
                          >
                            <PlayIcon className="w-5 h-5 fill-current" />
                          </button>
                        )}
                        
                        {entry.status !== 'completed' && (
                          <button 
                            onClick={() => setEntryToCancel(entry)}
                            className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-sm transition-all"
                            title="Abortar Proceso"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        )}

                        {entry.status === 'completed' && (
                           <div className="p-2 text-emerald-500/20">
                              <CheckCircleIcon className="w-5 h-5" />
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PANEL LATERAL: PENDING VERIFICATION */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0c0e12] border border-white/[0.05] rounded-sm overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-white/[0.05] bg-white/[0.02]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Pending_Verification</h3>
            </div>

            <div className="min-h-[250px] bg-black/20">
              {pendingAppointmentsToday.length === 0 ? (
                <div className="p-16 text-center opacity-20">
                  <p className="text-[9px] font-mono uppercase tracking-widest italic font-black">Buffer_Clean</p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.03]">
                  {pendingAppointmentsToday.map((appt) => (
                    <div key={appt.id} className="px-5 py-4 flex justify-between items-center group hover:bg-white/[0.01] transition-colors">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[11px] font-black text-white/70 uppercase tracking-tight truncate max-w-[150px]">{appt.patient.full_name}</p>
                        <span className="text-[8px] font-mono text-white/20 uppercase">REF_{appt.id.toString().slice(-6)}</span>
                      </div>

                      <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => updateAppointmentStatus.mutate({ id: appt.id, status: "waiting" })}
                          className="p-1.5 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10 rounded-sm transition-all"
                        >
                          <PlayIcon className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button 
                          onClick={() => updateAppointmentStatus.mutate({ id: appt.id, status: "canceled" })}
                          className="p-1.5 text-red-500/40 border border-white/5 hover:border-red-500/20 hover:bg-red-500/10 rounded-sm transition-all"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PROTOCOLO CARD */}
          <div className="p-5 border border-white/[0.03] bg-white/[0.01] rounded-sm space-y-3">
             <div className="flex items-center gap-2 text-[var(--palantir-active)]">
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Protocolo_Sala</span>
             </div>
             <p className="text-[10px] text-white/30 leading-relaxed font-medium italic">
               Asegure la verificación de identidad del paciente mediante el ID de referencia antes de iniciar la consulta. Los registros marcados como "Resolved" se archivarán automáticamente al finalizar la jornada.
             </p>
          </div>
        </div>
      </div>

      {/* MODALS & TOASTS */}
      {showModal && (
        <RegisterWalkinModal 
          onClose={() => setShowModal(false)} 
          onSuccess={(id) => registerArrival.mutate({ patient_id: id })} 
          existingEntries={entries ?? []} 
        />
      )}

      {entryToCancel && (
        <ConfirmGenericModal
          title="Abort_Process"
          message={`¿Confirma la cancelación del flujo operativo para ${entryToCancel.patient.full_name}?`}
          onConfirm={() => { handleStatusChange(entryToCancel, "canceled"); setEntryToCancel(null); }}
          onCancel={() => setEntryToCancel(null)}
        />
      )}

      {showConfirmClose && (
        <ConfirmCloseDayModal
          onConfirm={() => { 
            queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] }); 
            setShowConfirmClose(false); 
            setToast({ message: "Jornada finalizada correctamente", type: "success" });
          }}
          onCancel={() => setShowConfirmClose(false)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
