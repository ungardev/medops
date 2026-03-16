// src/pages/WaitingRoom/WaitingRoom.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RegisterWalkinModal from "@/components/WaitingRoom/RegisterWalkinModal";
import ConfirmCloseDayModal from "@/components/WaitingRoom/ConfirmCloseDayModal";
import ConfirmGenericModal from "@/components/Common/ConfirmGenericModal";
import Toast from "@/components/Common/Toast";
import PageHeader from "@/components/Common/PageHeader";
import InstitutionSelector from "@/components/WaitingRoom/InstitutionSelector";
import InstitutionFilter from "@/components/WaitingRoom/InstitutionFilter";
import { useUpdateWaitingRoomStatus } from "@/hooks/waitingroom/useUpdateWaitingRoomStatus";
import { useRegisterArrival } from "@/hooks/waitingroom/useRegisterArrival";
import { useUpdateAppointmentStatus } from "@/hooks/appointments/useUpdateAppointmentStatus";
import { useStartConsultation } from "@/hooks/waitingroom/useStartConsultation";
import type { WaitingRoomEntry, WaitingRoomStatus } from "@/types/waitingRoom";
import type { Appointment, AppointmentStatus } from "@/types/appointments";
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
import { useOperationalHub } from "@/hooks/waitingroom/useOperationalHub";
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
  const minutes = Math.floor((Date.now() - new Date(entry.arrival_time).getTime() / 60000));
  return (
    <div className="flex items-center gap-1 font-mono text-[10px] text-[var(--palantir-muted)]">
      <ClockIcon className="w-3 h-3 text-amber-500/70" />
      <span>{minutes < 60 ? `${minutes}m` : `${Math.floor(minutes/60)}h ${minutes%60}m`}</span>
    </div>
  );
};
const waitingRoomToAppointmentStatus = (status: WaitingRoomStatus): AppointmentStatus => {
  switch (status) {
    case "waiting":
      return "arrived";
    case "in_consultation":
      return "in_consultation";
    case "completed":
      return "completed";
    case "canceled":
      return "canceled";
    case "no_show":
      return "canceled";
    default:
      return "pending";
  }
};
export default function WaitingRoom() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [entryToCancel, setEntryToCancel] = useState<WaitingRoomEntry | null>(null);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: hubData, isLoading, isFetching } = useOperationalHub(selectedInstitutionId);
  
  const liveQueue = hubData?.live_queue ?? [];
  const pendingEntries = hubData?.pending_entries ?? [];
  const categories = hubData?.filters.categories ?? [];
  const services = hubData?.filters.services ?? [];
  const updateWaitingRoomStatus = useUpdateWaitingRoomStatus();
  const updateAppointmentStatus = useUpdateAppointmentStatus();
  const registerArrival = useRegisterArrival();
  const startConsultation = useStartConsultation();
  const filteredLiveQueue = liveQueue.filter(entry => {
    const matchesInstitution = !selectedInstitutionId || entry.institution === selectedInstitutionId;
    const serviceId = entry.appointment?.doctor_service;
    const service = services.find(s => s.id === serviceId);
    const categoryId = service?.category_id;
    const matchesCategory = !selectedCategory || categoryId === selectedCategory;
    const matchesService = !selectedService || serviceId === selectedService;
    return matchesInstitution && matchesCategory && matchesService;
  });
  const filteredPendingEntries = pendingEntries.filter(appt => {
    const matchesInstitution = !selectedInstitutionId || appt.institution === selectedInstitutionId;
    const matchesService = !selectedService || appt.doctor_service === selectedService;
    const service = services.find(s => s.id === appt.doctor_service);
    const categoryId = service?.category_id;
    const matchesCategory = !selectedCategory || categoryId === selectedCategory;
    return matchesInstitution && matchesService && matchesCategory;
  });
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
      const appointmentStatus = waitingRoomToAppointmentStatus(newStatus);
      updateAppointmentStatus.mutate({ id: entry.appointment, status: appointmentStatus });
    } else {
      updateWaitingRoomStatus.mutate({ id: Number(entry.id), status: newStatus });
    }
  };
  
  const handleStartConsultation = async (entry: WaitingRoomEntry) => {
    try {
      await startConsultation.mutateAsync(Number(entry.id));
      navigate("/consultation");
    } catch (error) {
      console.error("Error iniciando consulta:", error);
      setToast({ message: "Error al iniciar consulta", type: "error" });
    }
  };
  const handleCheckIn = async (appointment: Appointment) => {
    try {
      await registerArrival.mutateAsync({
        patient_id: appointment.patient.id,
        appointment_id: appointment.id,
        institution_id: selectedInstitutionId
      });
      
      queryClient.invalidateQueries({ queryKey: ['operationalHub', selectedInstitutionId] });
      
      setToast({ message: "Llegada registrada exitosamente", type: "success" });
    } catch (error) {
      console.error("Error checking in:", error);
      setToast({ message: "Error al registrar llegada", type: "error" });
    }
  };
  const FilterControls = () => (
    <div className="flex gap-2">
      <select 
        value={selectedCategory ?? ''}
        onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
        className="bg-black/40 border border-white/10 text-white text-xs p-1 rounded max-w-[150px]"
      >
        <option value="">Todas las Categorías</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select 
        value={selectedService ?? ''}
        onChange={(e) => setSelectedService(e.target.value ? Number(e.target.value) : null)}
        className="bg-black/40 border border-white/10 text-white text-xs p-1 rounded max-w-[150px]"
      >
        <option value="">Todos los Servicios</option>
        {services
          .filter(s => !selectedCategory || s.category_id === selectedCategory)
          .map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  );
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 relative min-h-[80vh]">
      
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "WAITING_ROOM", active: true }
        ]}
        stats={[
          { label: "En Espera", value: filteredLiveQueue.filter(e => e.status === 'waiting').length, color: "text-amber-500" },
          { label: "En Consulta", value: filteredLiveQueue.filter(e => e.status === 'in_consultation').length, color: "text-white" },
          { label: "Finalizados", value: filteredLiveQueue.filter(e => e.status === 'completed').length, color: "text-emerald-500" }
        ]}
        actions={
          <div className="flex gap-2">
            <InstitutionSelector />
            <FilterControls />
            
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
              registrar Llegada
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
         {/* COLUMNA IZQUIERDA: LIVE QUEUE (FILTRADA) */}
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
               totalInstitution={filteredLiveQueue.length}
             />
           </div>
           
           <div className="min-h-[400px]">
             {filteredLiveQueue.length === 0 ? (
               <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-20 opacity-30 italic">
                 <p className="text-[11px] font-mono uppercase tracking-widest text-[var(--palantir-muted)]">No_Active_Entries_Found</p>
               </div>
             ) : (
               <div className="divide-y divide-[var(--palantir-border)]/40">
                 {filteredLiveQueue.map((entry, index) => (
                   <div 
                     key={entry.id} 
                     className="group flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-3 transition-colors border-l-2 gap-2 sm:gap-0"
                   >
                     <div className="flex items-start gap-4 flex-1 min-w-0">
                       <span className="mt-1 font-mono text-xs font-bold text-[var(--palantir-muted)] opacity-50">
                         {String(index + 1).padStart(2, '0')}.
                       </span>
                       <div className="flex flex-col gap-0.5 min-w-0">
                         <p className="text-[13px] font-black uppercase tracking-tight truncate">
                           {entry.patient.full_name}
                         </p>
                         
                         {entry.appointment?.doctor_service && (
                           <span className="text-[8px] font-mono text-blue-400/80 uppercase truncate">
                             {services.find(s => s.id === entry.appointment.doctor_service)?.name || 'General'}
                           </span>
                         )}
                         
                         {entry.institution_data && (
                           <div className="flex items-center gap-1.5 text-[9px] font-mono text-[var(--palantir-muted)] mt-1">
                             <BuildingOfficeIcon className="w-3 h-3 text-[var(--palantir-active)]/50 shrink-0" />
                             <span className="truncate">{entry.institution_data.name}</span>
                             {entry.institution_data.is_active && (
                               <span className="text-[7px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-500 rounded-full shrink-0">
                                 ACTIVE
                               </span>
                             )}
                           </div>
                         )}
                         
                         {renderWaitTime(entry)}
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-2 lg:gap-6 ml-auto sm:ml-0">
                       {renderStatusBadge(entry.status)}
                       <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                         {entry.status === 'waiting' && (
                           <button 
                             onClick={() => handleStartConsultation(entry)}
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
             <div className="text-[9px] font-mono text-[var(--palantir-muted)] opacity70 uppercase tracking-widest">
               Displaying {filteredLiveQueue.length} of {liveQueue.length} entries
               {selectedInstitutionId && liveQueue.length > filteredLiveQueue.length && (
                 <span className="ml-2 text-emerald-500/60">
                   (filtered by institution/category/service)
                 </span>
               )}
             </div>
           </div>
         </div>
         
         {/* COLUMNA DERECHA: PENDING ENTRIES (FILTRADAS) */}
         <div className="lg:col-span-4 flex flex-col bg-[var(--palantir-surface)] border border-[var(--palantir-border)] rounded-sm overflow-hidden shadow-sm h-fit">
           <div className="px-4 py-2.5 border-b border-[var(--palantir-border)] bg-white/[0.02]">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--palantir-muted)]">Pending_Verification</h3>
           </div>
           <div className="bg-black/20">
             {filteredPendingEntries.length === 0 ? (
               <div className="p-10 text-center opacity-40">
                 <p className="text-[10px] font-mono italic">STREAMS_CLEAN</p>
               </div>
             ) : (
               <div className="divide-y divide-[var(--palantir-border)]/30">
                 {filteredPendingEntries.map((appt) => (
                   <div key={appt.id} className="px-4 py-3 flex justify-between items-center group hover:bg-white/[0.01]">
                     <div className="flex flex-col min-w-0">
                       <p className="text-xs font-bold text-white uppercase truncate max-w-[140px]">{appt.patient.full_name}</p>
                       <span className="text-[8px] font-mono text-blue-400/80 uppercase truncate">
                         {services.find(s => s.id === appt.doctor_service)?.name || 'General'}
                       </span>
                       <span className="text-[9px] font-mono text-[var(--palantir-muted)] uppercase">REF_{appt.id.toString().slice(-6)}</span>
                     </div>
                     <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => handleCheckIn(appt)} 
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
       
       {/* MODALES */}
       {showModal && (
         <RegisterWalkinModal 
           onClose={() => setShowModal(false)}
           onSuccess={(id, institutionId, serviceId) => registerArrival.mutate({ 
             patient_id: id, 
             institution_id: institutionId,
             service_id: serviceId 
           })} 
           existingEntries={liveQueue} 
           institutionId={selectedInstitutionId}
           services={services} 
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
             queryClient.invalidateQueries({ queryKey: ['operationalHub', selectedInstitutionId] }); 
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