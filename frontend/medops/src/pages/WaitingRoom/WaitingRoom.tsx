// src/pages/WaitingRoom/WaitingRoom.tsx
import { useState, useEffect } from "react";
import RegisterWalkinModal from "@/components/WaitingRoom/RegisterWalkinModal";
import ConfirmCloseDayModal from "@/components/WaitingRoom/ConfirmCloseDayModal";
import ConfirmGenericModal from "@/components/Common/ConfirmGenericModal";
import Toast from "@/components/Common/Toast";
import PageHeader from "@/components/Common/PageHeader";
import InstitutionSelector from "@/components/WaitingRoom/InstitutionSelector";
import InstitutionFilter from "@/components/WaitingRoom/InstitutionFilter";
import { useWaitingRoomEntriesToday } from "@/hooks/waitingroom/useWaitingRoomEntriesToday";
import { useUpdateWaitingRoomStatus } from "@/hooks/waitingroom/useUpdateWaitingRoomStatus";
import { useRegisterArrival } from "@/hooks/waitingroom/useRegisterArrival";
import { useUpdateAppointmentStatus } from "@/hooks/appointments/useUpdateAppointmentStatus";
import type { WaitingRoomEntry, WaitingRoomStatus } from "@/types/waitingRoom";
import type { Appointment } from "@/types/appointments";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  PlayIcon, 
  XMarkIcon, 
  PlusIcon, 
  PowerIcon, 
  ClockIcon, 
  UserGroupIcon,
  BuildingOfficeIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
const renderStatusBadge = (status: string) => {
  const base = "inline-flex items-center justify-center px-2 py-0.5 text-[8px] rounded-sm font-black uppercase tracking-wider border whitespace-nowrap transition-all duration-300";
  
  switch (status) {
    case "waiting":
      return <span className={`${base} bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]`}>IN_QUEUE</span>;
    case "in_consultation":
      return <span className={`${base} bg-white/20 text-white border-white/40 shadow-[0_0_8px_rgba(255,255,255,0.15)] animate-pulse`}>IN_CONSULT</span>;
    case "completed":
      return <span className={`${base} bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.15)]`}>RESOLVED</span>;
    case "canceled":
      return <span className={`${base} bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.15)]`}>ABORTED</span>;
    default:
      return <span className={`${base} bg-white/5 text-white/40 border-white/10`}>{status.toUpperCase()}</span>;
  }
};
const renderWaitTime = (entry: WaitingRoomEntry) => {
  if (!entry.arrival_time) return "-";
  
  if (entry.status === 'completed') {
    return (
      <div className="flex items-center gap-1 font-mono text-[9px] text-emerald-500/60 uppercase">
        <CheckCircleIcon className="w-3 h-3" />
        <span>Session_Finalized</span>
      </div>
    );
  }
  const minutes = Math.floor((Date.now() - new Date(entry.arrival_time).getTime()) / 60000);
  return (
    <div className="flex items-center gap-1 font-mono text-[10px] text-[var(--palantir-muted)]">
      <ClockIcon className="w-3 h-3 text-amber-500/70" />
      <span>{minutes < 60 ? `${minutes}m` : `${Math.floor(minutes/60)}h ${minutes%60}m`}</span>
    </div>
  );
};
export default function WaitingRoom() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [entryToCancel, setEntryToCancel] = useState<WaitingRoomEntry | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | null>(null);
  
  const { data: entries, isLoading, isFetching } = useWaitingRoomEntriesToday();
  const updateWaitingRoomStatus = useUpdateWaitingRoomStatus();
  const updateAppointmentStatus = useUpdateAppointmentStatus();
  const registerArrival = useRegisterArrival();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  
  const { data: appointmentsToday } = useQuery({
    queryKey: ["appointmentsToday", today],
    queryFn: async (): Promise<Appointment[]> => {
      const res = await fetch(`/api/appointments/?date=&status__in=pending,canceled`);
      if (res.status === 204) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30000,
    initialData: [],
  });
  
  const filteredEntries = (entries ?? []).filter(entry =>
    ["waiting", "in_consultation", "completed"].includes(entry.status) &&
    (selectedInstitutionId ? entry.institution === selectedInstitutionId : true)
  );
  
  const orderedGroup = filteredEntries.filter((e) =>
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
    if (entry.appointment) {
      updateAppointmentStatus.mutate({ id: entry.appointment, status: newStatus });
    } else {
      updateWaitingRoomStatus.mutate({ id: Number(entry.id), status: newStatus });
    }
  };
  
  return (
    <div className="max-w-[1600px] mx-auto px-4 py-4 space-y-6 relative min-h-[80vh]">
      
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPS", path: "/" },
          { label: "WAITING_ROOM", active: true }
        ]}
        stats={[
          { label: "En Espera", value: orderedGroup.filter(e => e.status === 'waiting').length, color: "text-amber-500" },
          { label: "En Consulta", value: orderedGroup.filter(e => e.status === 'in_consultation').length, color: "text-white" },
          { label: "Finalizados", value: orderedGroup.filter(e => e.status === 'completed').length, color: "text-emerald-500" }
        ]}
        actions={
          <div className="flex gap-2">
            <InstitutionSelector />
            
            <button
              onClick={() => setShowConfirmClose(true)}
              className="px-3 py-1.5 text-[10px] font-black uppercase border border-red-500/40 bg-red-500/5 text-red-500 rounded-sm hover:bg-red-500/20 flex items-center gap-2 transition-all duration-300"
            >
              <PowerIcon className="w-3.5 h-3.5" />
              Cerrar Jornada
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 text-[10px] font-black uppercase bg-white text-black border border-white rounded-sm hover:bg-white/90 flex items-center gap-2 transition-all duration-300"
            >
              <PlusIcon className="w-3.5 h-3.5 stroke-[3px]" />
              Registrar Llegada
            </button>
          </div>
        }
      />
      
      {showOverlay && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10 animate-in fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-2 bg-[var(--palantir-surface)] border border-[var(--palantir-border)] shadow-xl rounded-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white">Syncing_Data_Stream...</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LISTA PRINCIPAL */}
        <div className="lg:col-span-8 flex flex-col bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm overflow-hidden shadow-sm">
          
          {/* HEADER CON FILTRO */}
          <div className="px-4 py-2.5 border-b border-[var(--palantir-border)] bg-white/[0.02] flex justify-between items-center">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-3.5 h-3.5 text-[var(--palantir-muted)]" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)]">Live_Queue_Stream</h3>
            </div>
            
            <InstitutionFilter
              selectedInstitutionId={selectedInstitutionId}
              onFilterChange={(id) => setSelectedInstitutionId(id)}
              totalInstitution={filteredEntries.length}
            />
          </div>
          
          <div className="min-h-[400px]">
            {filteredEntries.length === 0 ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-20 opacity-30 italic">
                <p className="text-[11px] font-mono uppercase tracking-widest text-[var(--palantir-muted)]">No_Active_Entries_Found</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--palantir-border)]/40">
                {filteredEntries.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className={`group flex justify-between items-center px-4 py-3 transition-colors border-l-2 `}
                  >
                    <div className="flex items-start gap-4">
                      <span className="mt-1 font-mono text-xs font-bold text-[var(--palantir-muted)] opacity-50">
                        {String(index + 1).padStart(2, '0')}.
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <p className={`text-[13px] font-black uppercase tracking-tight `}>
                          {entry.patient.full_name}
                        </p>
                        
                        {entry.institution_data && (
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-[var(--palantir-muted)] mt-1">
                            <BuildingOfficeIcon className="w-3 h-3 text-[var(--palantir-active)]/50" />
                            <span>{entry.institution_data.name}</span>
                            {entry.institution_data.is_active && (
                              <span className="text-[7px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-500 rounded-full ml-2">
                                ACTIVE
                              </span>
                            )}
                          </div>
                        )}
                        
                        {renderWaitTime(entry)}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {renderStatusBadge(entry.status)}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {entry.status === 'waiting' && (
                          <button 
                            onClick={() => handleStatusChange(entry, "in_consultation")}
                            className="p-1.5 text-white hover:bg-white/10 rounded-sm"
                          >
                            <PlayIcon className="w-5 h-5 fill-current" />
                          </button>
                        )}
                        {entry.status !== 'completed' && (
                          <button 
                            onClick={() => {setEntryToCancel(entry); setShowConfirmCancel(true);}}
                            className="p-1.5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-sm"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-4 py-2.5 border-t border-[var(--palantir-border)] bg-white/[0.02]">
            <div className="text-[9px] font-mono text-[var(--palantir-muted)] opacity-70 uppercase tracking-widest">
              Displaying {filteredEntries.length} of {orderedGroup.length} entries
              {selectedInstitutionId && orderedGroup.length > filteredEntries.length && (
                <span className="ml-2 text-emerald-500/60">
                  (filtered by institution)
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-4 flex flex-col bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm overflow-hidden shadow-sm h-fit">
          <div className="px-4 py-2.5 border-b border-[var(--palantir-border)] bg-white/[0.02]">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)]">Pending_Verification</h3>
          </div>
          <div className="bg-black/20">
            {pendingAppointmentsToday.length === 0 ? (
              <div className="p-10 text-center opacity-40">
                <p className="text-[10px] font-mono italic">STREAMS_CLEAN</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--palantir-border)]/30">
                {pendingAppointmentsToday.map((appt) => (
                  <div key={appt.id} className="px-4 py-3 flex justify-between items-center group hover:bg-white/[0.01]">
                    <div className="flex flex-col">
                      <p className="text-xs font-bold text-white uppercase truncate max-w-[140px]">{appt.patient.full_name}</p>
                      <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase">REF_{appt.id.toString().slice(-6)}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => updateAppointmentStatus.mutate({ id: appt.id, status: "waiting" })}
                        className="p-1 text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-sm"
                      >
                        <PlayIcon className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showModal && (
        <RegisterWalkinModal 
          onClose={() => setShowModal(false)}
          onSuccess={(id, institutionId) => registerArrival.mutate({ 
            patient_id: id, 
            institution_id: institutionId 
          })} 
          existingEntries={entries ?? []}
          institutionId={selectedInstitutionId}
        />
      )}
      
      {entryToCancel && (
        <ConfirmGenericModal
          open={showConfirmCancel}
          title="DESTRUCTIVE_ACTION_CONFIRMATION"
          message={`Protocol: Cancel operational flow for subject ${entryToCancel.patient.full_name}?`}
          confirmLabel="ABORT_OPERATION"
          cancelLabel="CANCEL_PROTOCOL"
          isDestructive={true}
          onConfirm={() => { 
            handleStatusChange(entryToCancel, "canceled"); 
            setEntryToCancel(null); 
            setShowConfirmCancel(false);
          }}
          onCancel={() => { 
            setEntryToCancel(null); 
            setShowConfirmCancel(false);
          }}
        />
      )}
      
      {showConfirmClose && (
        <ConfirmCloseDayModal
          onConfirm={() => { 
            queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] }); 
            setShowConfirmClose(false); 
            setToast({ message: "Daily operations terminated successfully", type: "success" });
          }}
          onCancel={() => setShowConfirmClose(false)}
        />
      )}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}