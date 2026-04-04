// src/pages/WaitingRoom/WaitingRoom.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RegisterWalkinModal from "@/components/WaitingRoom/RegisterWalkinModal";
import ConfirmCloseDayModal from "@/components/WaitingRoom/ConfirmCloseDayModal";
import ConfirmGenericModal from "@/components/Common/ConfirmGenericModal";
import Toast from "@/components/Common/Toast";
import PageHeader from "@/components/Common/PageHeader";
// ELIMINADO: import InstitutionSelector from "@/components/WaitingRoom/InstitutionSelector";
import InstitutionFilter from "@/components/WaitingRoom/InstitutionFilter";
import EliteDropdown from "@/components/Common/EliteDropdown";
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
import { useInstitutions } from "@/hooks/settings/useInstitutions"; 
// ... (renderStatusBadge y renderWaitTime permanecen igual - no cambian)
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
  
  // NUEVO: Obtener institución activa del contexto global
  const { activeInstitution } = useInstitutions();
  
  // Lógica para manejar selectedInstitutionId:
  // Prioridad: selección manual > institución activa global > null
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | null>(() => activeInstitution?.id || null);
  
  // Efecto para sincronizar si la institución activa cambia en ConfigPage
  useEffect(() => {
    if (activeInstitution?.id && selectedInstitutionId !== activeInstitution.id) {
      setSelectedInstitutionId(activeInstitution.id);
    }
  }, [activeInstitution, selectedInstitutionId]);
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Extraemos refetch para forzar recargas manuales
  const { data: hubData, isLoading, isFetching, refetch } = useOperationalHub(selectedInstitutionId);
  const liveQueue = hubData?.live_queue ?? [];
  const pendingEntries = hubData?.pending_entries ?? [];
  const categories = hubData?.filters.categories ?? [];
  const services = hubData?.filters.services ?? [];
  const updateWaitingRoomStatus = useUpdateWaitingRoomStatus();
  const updateAppointmentStatus = useUpdateAppointmentStatus();
  const registerArrival = useRegisterArrival();
  const startConsultation = useStartConsultation();
  
  // --- Lógica de Filtrado Mejorada ---
  const filteredLiveQueue = liveQueue.filter(entry => {
    const matchesInstitution = !selectedInstitutionId || entry.institution === selectedInstitutionId;
    
    // ⚠️ CORRECCIÓN: Manejo seguro de serviceId (usando el nuevo campo del serializer)
    const serviceId = entry.serviceId; // Acceso directo al campo serviceId del serializer
    const service = services.find(s => s.id === serviceId);
    const categoryId = service?.category_id;
    
    // Si se selecciona categoría/servicio pero la entrada no tiene servicio, no mostrar
    const hasServiceOrNoFilter = (serviceId !== undefined && serviceId !== null) || (!selectedCategory && !selectedService);
    
    const matchesCategory = !selectedCategory || categoryId === selectedCategory;
    const matchesService = !selectedService || serviceId === selectedService;
    
    return matchesInstitution && matchesCategory && matchesService && hasServiceOrNoFilter;
  });
  
  const filteredPendingEntries = pendingEntries.filter(appt => {
    const apptInstitutionId = typeof appt.institution === 'object' ? appt.institution?.id : appt.institution;
    const matchesInstitution = !selectedInstitutionId || apptInstitutionId === selectedInstitutionId;
    
    const serviceId = appt.doctor_service || appt.doctor_service?.id; 
    const service = services.find(s => s.id === serviceId);
    const categoryId = service?.category_id;
    
    const hasServiceOrNoFilter = (serviceId !== undefined && serviceId !== null) || (!selectedCategory && !selectedService);
    
    const matchesCategory = !selectedCategory || categoryId === selectedCategory;
    const matchesService = !selectedService || serviceId === selectedService;
    
    return matchesInstitution && matchesService && matchesCategory && hasServiceOrNoFilter;
  });
  // ----------------------------------
  
  // Servicios filtrados por categoría seleccionada (para el dropdown de servicios)
  const filteredServices = selectedCategory
    ? services.filter(s => s.category_id === selectedCategory)
    : services;
    
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
      updateAppointmentStatus.mutate({ id: entry.appointment.id, status: appointmentStatus });
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
    const institutionIdToSend = selectedInstitutionId ?? activeInstitution?.id ?? null;
    
    // CORRECCIÓN: Manejar tanto objeto paciente como ID directo
    const patientId = appointment.patient && typeof appointment.patient === 'object' 
      ? appointment.patient.id 
      : appointment.patient;
    const appointmentId = appointment.id;
    
    if (!patientId) {
      console.error('[handleCheckIn] patientId no encontrado:', appointment);
      setToast({ message: "El ID del paciente es requerido", type: "error" });
      return;
    }
    
    if (!institutionIdToSend) {
      setToast({ message: "No se puede registrar llegada sin institución activa", type: "error" });
      return;
    }
    
    try {
      await registerArrival.mutateAsync({
        patient_id: patientId,
        appointment_id: appointmentId,
        institution_id: institutionIdToSend,
        service_id: null
      });
      
      queryClient.invalidateQueries({ queryKey: ['operationalHub', selectedInstitutionId] });
      setToast({ message: "Llegada registrada exitosamente", type: "success" });
    } catch (error) {
      console.error("Error checking in:", error);
      setToast({ message: "Error al registrar llegada", type: "error" });
    }
  };
  
  const handleOpenRegisterModal = async () => {
    // Si no hay datos de servicios o están vacíos, intentar refrescar
    if (!services || services.length === 0) {
      await refetch(); // Forza la recarga de datos del hub
    }
    setShowModal(true);
  };
  
  // Componente de filtros actualizado con EliteDropdown
  const FilterControls = () => (
    <div className="flex gap-2">
      {/* Selector de Categorías con diseño Elite */}
      <EliteDropdown
        options={categories}
        value={selectedCategory}
        onChange={setSelectedCategory}
        placeholder="Todas las Categorías"
        label="CATEGORÍAS"
      />
      
      {/* Selector de Servicios con diseño Elite */}
      <EliteDropdown
        options={filteredServices}
        value={selectedService}
        onChange={setSelectedService}
        placeholder="Todos los Servicios"
        label="SERVICIOS"
      />
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
          <div className="flex flex-wrap gap-2 justify-end items-center">
            {/* ELIMINADO: <InstitutionSelector /> */}
            <FilterControls />
            
            <button
              onClick={() => setShowConfirmClose(true)}
              className="px-3 py-1.5 text-[10px] font-black uppercase border border-red-500/40 bg-red-500/5 text-red-500 rounded-sm hover:bg-red-500/20 flex items-center gap-2 transition-all duration-300"
            >
              <PowerIcon className="w-3.5 h-3.5" />
              Cerrar Jornada
            </button>
            <button
              onClick={handleOpenRegisterModal}
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
                         
                         {/* ⚠️ CORRECCIÓN: Usar entry.serviceId directamente del serializer */}
                         {entry.serviceId && (
                           <span className="text-[8px] font-mono text-blue-400/80 uppercase truncate">
                             {services.find(s => s.id === entry.serviceId)?.name || 'General'}
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
                    <div key={appt.id} className="px-4 py-4 flex justify-between items-center group border-b border-white/5 hover:bg-white/5">
                      <div className="flex flex-col min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-white">{appt.patient_name || 'Paciente desconocido'}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-white/70">
                          <span className="flex items-center gap-1">
                            <BuildingOfficeIcon className="h-3 w-3 text-blue-400" />
                            <span>{services.find(s => s.id === appt.doctor_service)?.name || 'General'}</span>
                          </span>
                          {appt.tentative_time && (
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-3 w-3 text-blue-400" />
                              <span>{appt.tentative_time}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs">
                          <span className="flex items-center gap-1 text-[var(--palantir-muted)]">
                            <span className="font-mono">REF:</span> 
                            <span className="font-mono text-white/80">{appt.id.toString().slice(-6)}</span>
                          </span>
                          {appt.charge_order && (
                            <>
                              {appt.charge_order?.balance_due === 0 && appt.charge_order?.total > 0 && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 rounded">
                                  PAGADO
                                </span>
                              )}
                              {appt.charge_order?.balance_due > 0 && (
                                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-400 rounded">
                                  PENDIENTE
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleCheckIn(appt)} 
                          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-md hover:bg-emerald-500/20 transition-all"
                        >
                          <PlayIcon className="h-4 w-4" />
                          Registrar Llegada
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
             onSuccess={async (id, institutionId, serviceId) => {
                // ⚠️ CORRECCIÓN DE TIPO: Asegurar que institution_id sea number | null
                const institutionIdToSend = institutionId ?? selectedInstitutionId ?? activeInstitution?.id ?? null;
                await registerArrival.mutateAsync({ 
                  patient_id: id, 
                  institution_id: institutionIdToSend,
                  service_id: serviceId 
                });
                // ⚠️ CORRECCIÓN: Invalidar caché operativa para ver la entrada inmediatamente
                queryClient.invalidateQueries({ queryKey: ['operationalHub', selectedInstitutionId] });
             }}
             existingEntries={liveQueue} 
             institutionId={selectedInstitutionId || activeInstitution?.id}
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