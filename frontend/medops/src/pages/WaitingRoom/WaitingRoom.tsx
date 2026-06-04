// src/pages/WaitingRoom/WaitingRoom.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import RegisterWalkinModal from "@/components/WaitingRoom/RegisterWalkinModal";
import ConfirmCloseDayModal from "@/components/WaitingRoom/ConfirmCloseDayModal";
import ConfirmGenericModal from "@/components/Common/ConfirmGenericModal";
import Toast from "@/components/Common/Toast";
import PageHeader from "@/components/Common/PageHeader";
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
const renderStatusBadge = (status: string) => {
  const base = "inline-flex items-center justify-center px-3 py-1.5 text-xs rounded-md font-medium border whitespace-nowrap transition-all duration-300";
  
  switch (status) {
    case "waiting":
      return <span className={`${base} bg-amber-500/10 text-amber-400 border-amber-500/20`}>En Espera</span>;
    case "in_consultation":
      return <span className={`${base} bg-white/10 text-white border-white/20`}>En Consulta</span>;
    case "completed":
      return <span className={`${base} bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>Finalizado</span>;
    case "canceled":
      return <span className={`${base} bg-red-500/10 text-red-400 border-red-500/20`}>Cancelado</span>;
    default:
      return <span className={`${base} bg-white/5 text-white/40 border-white/10`}>{status}</span>;
  }
};
const renderWaitTime = (entry: WaitingRoomEntry) => {
  if (!entry.arrival_time) return "-";
  
  if (entry.status === 'completed') {
    return (
      <div className="flex items-center gap-1 text-emerald-400">
        <CheckCircleIcon className="w-4 h-4" />
        <span className="text-sm font-medium">Finalizado</span>
      </div>
    );
  }
  const minutes = Math.floor((Date.now() - new Date(entry.arrival_time).getTime()) / 60000);
  return (
    <div className="flex items-center gap-1.5 text-sm text-white/60">
      <ClockIcon className="w-4 h-4 text-amber-400" />
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
  
  const { activeInstitution } = useInstitutions();
  
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | null>(() => activeInstitution?.id || null);
  
  useEffect(() => {
    if (activeInstitution?.id && selectedInstitutionId !== activeInstitution.id) {
      setSelectedInstitutionId(activeInstitution.id);
    }
  }, [activeInstitution, selectedInstitutionId]);
  
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: hubData, isLoading, isFetching, refetch } = useOperationalHub(selectedInstitutionId);
  const liveQueue = hubData?.live_queue ?? [];
  const pendingEntries = hubData?.pending_entries ?? [];
  const categories = hubData?.filters.categories ?? [];
  const services = hubData?.filters.services ?? [];
  const updateWaitingRoomStatus = useUpdateWaitingRoomStatus();
  const updateAppointmentStatus = useUpdateAppointmentStatus();
  const registerArrival = useRegisterArrival();
  const startConsultation = useStartConsultation();
  
  const filteredLiveQueue = useMemo(() => liveQueue.filter(entry => {
    const matchesInstitution = !selectedInstitutionId || entry.institution === selectedInstitutionId;
    const serviceId = entry.serviceId;
    const service = services.find(s => s.id === serviceId);
    const categoryId = service?.category_id;
    const hasServiceOrNoFilter = (serviceId !== undefined && serviceId !== null) || (!selectedCategory && !selectedService);
    const matchesCategory = !selectedCategory || categoryId === selectedCategory;
    const matchesService = !selectedService || serviceId === selectedService;
    return matchesInstitution && matchesCategory && matchesService && hasServiceOrNoFilter;
  }), [liveQueue, selectedInstitutionId, selectedCategory, selectedService, services]);
  
  const filteredPendingEntries = useMemo(() => pendingEntries.filter(appt => {
    const apptInstitutionId = typeof appt.institution === 'object' ? appt.institution?.id : appt.institution;
    const matchesInstitution = !selectedInstitutionId || apptInstitutionId === selectedInstitutionId;
    const serviceId = appt.doctor_service || appt.doctor_service?.id; 
    const service = services.find(s => s.id === serviceId);
    const categoryId = service?.category_id;
    const hasServiceOrNoFilter = (serviceId !== undefined && serviceId !== null) || (!selectedCategory && !selectedService);
    const matchesCategory = !selectedCategory || categoryId === selectedCategory;
    const matchesService = !selectedService || serviceId === selectedService;
    return matchesInstitution && matchesService && matchesCategory && hasServiceOrNoFilter;
  }), [pendingEntries, selectedInstitutionId, selectedCategory, selectedService, services]);
  
const filteredServices = useMemo(() => 
    selectedCategory ? services.filter(s => s.category_id === selectedCategory) : services
  , [selectedCategory, services]);
  const [showOverlay, setShowOverlay] = useState(false);
  
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
  
  const handleOpenRegisterModal = () => {
    setShowModal(true);
  };
  
  const FilterControls = () => (
    <div className="flex gap-3">
      <EliteDropdown
        options={categories}
        value={selectedCategory}
        onChange={setSelectedCategory}
        placeholder="Todas las Categorías"
        label="CATEGORÍAS"
      />
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
    <div className="space-y-6">
      
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/doctor" },
          { label: "Sala de Espera", active: true }
        ]}
        stats={[
          { label: "En Espera", value: filteredLiveQueue.filter(e => e.status === 'waiting').length, color: "text-amber-400" },
          { label: "En Consulta", value: filteredLiveQueue.filter(e => e.status === 'in_consultation').length, color: "text-white/70" },
          { label: "Finalizados", value: filteredLiveQueue.filter(e => e.status === 'completed').length, color: "text-emerald-400" }
        ]}
        actions={
          <div className="flex flex-wrap gap-3 justify-end items-center">
            <FilterControls />
            <button
              onClick={() => setShowConfirmClose(true)}
              className="px-4 py-2.5 text-sm font-medium border border-red-500/20 bg-red-500/5 text-red-400 rounded-lg hover:bg-red-500/10 flex items-center gap-2 transition-all"
            >
              <PowerIcon className="w-4 h-4" />
              Cerrar Jornada
            </button>
            <button
              onClick={handleOpenRegisterModal}
              className="px-4 py-2.5 text-sm font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-lg hover:bg-emerald-500/25 flex items-center gap-2 transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              Registrar Llegada
            </button>
          </div>
        }
      />
      
      {showOverlay && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10 animate-in fade-in duration-300">
          <div className="flex items-center gap-3 px-5 py-3 bg-white/5 border border-white/15 shadow-lg rounded-lg">
            <div className="w-2.5 h-2.5 bg-white/50 rounded-full animate-pulse" />
            <span className="text-sm text-white/50">Cargando datos...</span>
          </div>
        </div>
)}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col bg-white/5 border border-white/15 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <UserGroupIcon className="w-5 h-5 text-white/50" />
              <h3 className="text-sm font-semibold text-white/70">Cola de Atención</h3>
            </div>
            <InstitutionFilter
              selectedInstitutionId={selectedInstitutionId}
              onFilterChange={(id) => setSelectedInstitutionId(id)}
              totalInstitution={filteredLiveQueue.length}
            />
          </div>
          
          <div className="min-h-[450px]">
            {isLoading && !hubData ? (
              <div className="h-full min-h-[450px] flex flex-col items-center justify-center p-24">
                <div className="w-10 h-10 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                <span className="text-sm text-white/50 mt-5">Cargando sala de espera...</span>
              </div>
            ) : filteredLiveQueue.length === 0 ? (
              <div className="h-full min-h-[450px] flex flex-col items-center justify-center p-24">
                <p className="text-sm text-white/30">No hay pacientes en espera</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredLiveQueue.map((entry, index) => (
                  <div 
                    key={entry.id} 
                    className="group flex flex-col sm:flex-row justify-between items-start sm:items-center px-6 py-5 transition-colors border-l-2 border-transparent hover:border-white/10 gap-3 sm:gap-0"
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <span className="mt-1 text-sm font-medium text-white/50">
                        {String(index + 1).padStart(2, '0')}.
                      </span>
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-base font-medium text-white/80 truncate">
                          {entry.patient.full_name}
                        </p>
                        {entry.serviceId && (
                          <span className="text-sm text-blue-400 truncate">
                            {services.find(s => s.id === entry.serviceId)?.name || 'General'}
                          </span>
                        )}
                        {entry.institution_data && (
                          <div className="flex items-center gap-2 text-sm text-white/50 mt-1">
                            <BuildingOfficeIcon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{entry.institution_data.name}</span>
                          </div>
                        )}
                        {renderWaitTime(entry)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 lg:gap-4 ml-auto sm:ml-0">
                      {renderStatusBadge(entry.status)}
                      <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        {entry.status === 'waiting' && (
                          <button 
                            onClick={() => handleStartConsultation(entry)}
                            className="p-2 text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          >
                            <PlayIcon className="w-5 h-5" />
                          </button>
                        )}
                        {entry.status !== 'completed' && (
                          <button 
                            onClick={() => {setEntryToCancel(entry); setShowConfirmCancel(true);}}
                            className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
          
          <div className="px-6 py-4 border-t border-white/10 bg-white/5">
            <div className="text-sm text-white/50">
              Mostrando {filteredLiveQueue.length} de {liveQueue.length} registros
              {selectedInstitutionId && liveQueue.length > filteredLiveQueue.length && (
                <span className="ml-3 text-emerald-400/50">
                  (filtrado por institución/categoría/servicio)
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-4 flex flex-col bg-white/5 border border-white/15 rounded-xl overflow-hidden h-fit">
          <div className="px-6 py-4 border-b border-white/10 bg-white/5">
            <h3 className="text-sm font-medium text-white/60">Pendientes de Verificación</h3>
          </div>
          <div className="bg-black/20">
            {filteredPendingEntries.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm text-white/50 italic">Sin registros pendientes</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredPendingEntries.map((appt) => (
                  <div key={appt.id} className="px-6 py-5 flex justify-between items-center group border-b border-white/5 hover:bg-white/5">
                    <div className="flex flex-col min-w-0 space-y-2">
                      <p className="text-base font-semibold text-white/80">{appt.patient_name || 'Paciente desconocido'}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1.5">
                          <BuildingOfficeIcon className="h-4 w-4 text-blue-400/60" />
                          <span>{services.find(s => s.id === appt.doctor_service)?.name || 'General'}</span>
                        </span>
                        {appt.tentative_time && (
                          <span className="flex items-center gap-1.5">
                            <ClockIcon className="h-4 w-4 text-blue-400/50" />
                            <span>{appt.tentative_time}</span>
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-sm text-white/50">
                          <span className="font-mono">REF:</span> 
                          <span className="font-mono text-white/70">{appt.id.toString().slice(-6)}</span>
                        </span>
                        {appt.charge_order && (
                          <>
                            {appt.charge_order?.balance_due === 0 && appt.charge_order?.total > 0 && (
                              <span className="px-3 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                                Pagado
                              </span>
                            )}
                            {appt.charge_order?.balance_due > 0 && (
                              <span className="px-3 py-1 text-xs font-medium bg-amber-500/10 text-amber-400 rounded-md border border-amber-500/20">
                                Pendiente
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleCheckIn(appt)} 
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/15 transition-all"
                      >
                        <PlayIcon className="h-5 w-5" />
                        Registrar
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
          onSuccess={async (id, institutionId, serviceId) => {
            const institutionIdToSend = institutionId ?? selectedInstitutionId ?? activeInstitution?.id ?? null;
            await registerArrival.mutateAsync({ 
              patient_id: id, 
              institution_id: institutionIdToSend,
              service_id: serviceId 
            });
            queryClient.invalidateQueries({ queryKey: ['operationalHub', selectedInstitutionId] });
          }}
          existingEntries={liveQueue} 
          institutionId={selectedInstitutionId || activeInstitution?.id}
          services={services}
          isServicesLoading={isLoading}
        />
      )}
      
      {entryToCancel && (
        <ConfirmGenericModal
          open={showConfirmCancel}
          title="Cancelar registro"
          message={`¿Estás seguro de que deseas cancelar el registro de ${entryToCancel.patient.full_name}?`}
          confirmLabel="Cancelar"
          cancelLabel="No, mantener"
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
            setToast({ message: "Jornada cerrada exitosamente", type: "success" });
          }}
          onCancel={() => setShowConfirmClose(false)}
        />
      )}
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}