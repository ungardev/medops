// src/pages/WaitingRoom/WaitingRoom.tsx
import { useState, useEffect } from "react";
import RegisterWalkinModal from "../../components/WaitingRoom/RegisterWalkinModal";
import ConfirmCloseDayModal from "../../components/WaitingRoom/ConfirmCloseDayModal";
import ConfirmGenericModal from "../../components/Common/ConfirmGenericModal";
import Toast from "../../components/Common/Toast";
import PageHeader from "../../components/Common/PageHeader";

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
  UserGroupIcon 
} from "@heroicons/react/24/outline";

/**
 * Renders technical status badges following MedOps aesthetic
 */
const renderStatusBadge = (status: string) => {
  const base = "inline-flex items-center justify-center px-2 py-0.5 text-[9px] rounded-sm font-bold uppercase tracking-tighter border whitespace-nowrap transition-all";

  switch (status) {
    case "waiting":
      return <span className={`${base} bg-amber-500/10 text-amber-500 border-amber-500/20`}>In_Queue</span>;
    case "in_consultation":
      return <span className={`${base} bg-[var(--palantir-active)]/10 text-[var(--palantir-active)] border-[var(--palantir-active)]/20 animate-pulse`}>In_Consult</span>;
    case "pending":
      return <span className={`${base} bg-slate-500/10 text-slate-400 border-slate-500/20`}>Pending</span>;
    case "completed":
      return <span className={`${base} bg-emerald-500/10 text-emerald-500 border-emerald-500/20`}>Resolved</span>;
    case "canceled":
      return <span className={`${base} bg-red-500/10 text-red-500 border-red-500/20`}>Aborted</span>;
    default:
      return <span className={`${base} bg-slate-500/10 text-slate-400 border-slate-500/20`}>{status}</span>;
  }
};

/**
 * Calculates and formats waiting time in a mono font
 */
const renderWaitTime = (arrival_time: string | null) => {
  if (!arrival_time) return "-";
  const minutes = Math.floor((Date.now() - new Date(arrival_time).getTime()) / 60000);
  return (
    <div className="flex items-center gap-1 font-mono text-[10px] text-[var(--palantir-muted)]">
      <ClockIcon className="w-3 h-3 text-amber-500/70" />
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

  const inConsultationCount = orderedGroup.filter(e => e.status === 'in_consultation').length;

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-4 space-y-6 relative min-h-[80vh]">
      
      {/* HEADER INTEGRADO */}
      <PageHeader 
        breadcrumb="MEDOPS // OPS_CENTRAL // WAITING_ROOM"
        title="Gestión de Sala"
        stats={[
          { label: "En Espera", value: orderedGroup.filter(e => e.status === 'waiting').length },
          { label: "En Consulta", value: inConsultationCount, color: inConsultationCount > 0 ? "text-[var(--palantir-active)]" : "text-[var(--palantir-muted)]" },
          { label: "Pendientes", value: pendingAppointmentsToday.length }
        ]}
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirmClose(true)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase border border-red-500/30 text-red-500/80 rounded-sm hover:bg-red-500/5 flex items-center gap-2 transition-all"
            >
              <PowerIcon className="w-3.5 h-3.5" />
              Cerrar Jornada
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase bg-[var(--palantir-active)] text-white rounded-sm hover:opacity-90 flex items-center gap-2 shadow-sm transition-all"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Registrar Llegada
            </button>
          </div>
        }
      />

      {/* OVERLAY DE SINCRONIZACIÓN */}
      {showOverlay && (
        <div className="absolute inset-0 bg-[var(--palantir-bg)]/40 backdrop-blur-[1px] flex items-center justify-center z-10 animate-in fade-in duration-300">
           <div className="flex items-center gap-3 px-4 py-2 bg-[var(--palantir-surface)] border border-[var(--palantir-border)] shadow-xl rounded-sm">
              <div className="w-2 h-2 bg-[var(--palantir-active)] rounded-full animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--palantir-text)]">Syncing_Data_Stream...</span>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL PRINCIPAL: LIVE QUEUE */}
        <div className="lg:col-span-8 flex flex-col bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 border-b border-[var(--palantir-border)] bg-[var(--palantir-bg)]/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-3.5 h-3.5 text-[var(--palantir-muted)]" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)]">Live_Queue_Stream</h3>
            </div>
            <span className="text-[9px] font-mono text-[var(--palantir-muted)] opacity-50 uppercase">Active_Link</span>
          </div>

          <div className="min-h-[400px]">
            {orderedGroup.length === 0 ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-20 opacity-30 italic">
                <p className="text-[11px] font-mono uppercase tracking-widest text-[var(--palantir-muted)]">No_Active_Entries_Found</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--palantir-border)]/40">
                {orderedGroup.map((entry) => (
                  <div key={entry.id} className="group flex justify-between items-center px-4 py-3 hover:bg-[var(--palantir-active)]/[0.03] transition-colors border-l-2 border-transparent hover:border-l-[var(--palantir-active)]">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[13px] font-black text-[var(--palantir-text)] uppercase tracking-tight">{entry.patient.full_name}</p>
                      {renderWaitTime(entry.arrival_time)}
                    </div>

                    <div className="flex items-center gap-6">
                      {renderStatusBadge(entry.status)}
                      
                      <div className="flex items-center gap-1">
                        {entry.status === 'waiting' && (
                          <button 
                            onClick={() => handleStatusChange(entry, "in_consultation")}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-sm transition-all"
                            title="Iniciar Consulta"
                          >
                            <PlayIcon className="w-5 h-5 fill-current" />
                          </button>
                        )}
                        {entry.status === 'in_consultation' && (
                          <button 
                            onClick={() => handleStatusChange(entry, "completed")}
                            className="p-1.5 text-[var(--palantir-active)] hover:bg-[var(--palantir-active)]/10 rounded-sm transition-all"
                            title="Finalizar"
                          >
                            <PlayIcon className="w-5 h-5 fill-current rotate-90" />
                          </button>
                        )}
                        <button 
                          onClick={() => setEntryToCancel(entry)}
                          className="p-1.5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-sm transition-all"
                          title="Abortar Proceso"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PANEL LATERAL: PENDING VERIFICATION */}
        <div className="lg:col-span-4 flex flex-col bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm overflow-hidden shadow-sm">
          <div className="px-4 py-2.5 border-b border-[var(--palantir-border)] bg-[var(--palantir-bg)]/30">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)]">Pending_Verification</h3>
          </div>

          <div className="bg-[var(--palantir-bg)]/10 min-h-[200px]">
            {pendingAppointmentsToday.length === 0 ? (
              <div className="p-10 text-center opacity-40">
                <p className="text-[10px] font-mono italic">STREAMS_CLEAN</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--palantir-border)]/30">
                {pendingAppointmentsToday.map((appt) => (
                  <div key={appt.id} className="px-4 py-3 flex justify-between items-center group">
                    <div className="flex flex-col">
                      <p className="text-xs font-bold text-[var(--palantir-text)] uppercase tracking-tight truncate max-w-[140px]">{appt.patient.full_name}</p>
                      <span className="text-[9px] font-mono text-[var(--palantir-muted)]">REF_ID: {appt.id.toString().slice(-6).toUpperCase()}</span>
                    </div>

                    <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => updateAppointmentStatus.mutate({ id: appt.id, status: "waiting" })}
                        className="p-1 text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-sm"
                        title="Validar Llegada"
                      >
                        <PlayIcon className="w-4 h-4 fill-current" />
                      </button>
                      <button 
                        onClick={() => updateAppointmentStatus.mutate({ id: appt.id, status: "canceled" })}
                        className="p-1 text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-sm"
                        title="Cancelar"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALES TÉCNICOS */}
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
