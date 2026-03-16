// src/pages/Appointments/Appointments.tsx
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import moment from "moment";
import axios from "axios"; // ✅ NUEVO: Importar axios
import { Appointment, AppointmentInput, AppointmentStatus } from "types/appointments";
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ChartBarIcon, 
  ArrowPathIcon,
  CheckCircleIcon // ✅ NUEVO: Icono para confirmar
} from "@heroicons/react/24/outline";
// Componentes
import AppointmentsList from "components/Appointments/AppointmentsList";
import AppointmentForm from "components/Appointments/AppointmentForm";
import AppointmentEditForm from "components/Appointments/AppointmentEditForm";
import CalendarGrid from "components/Appointments/CalendarGrid";
import AppointmentFilters from "components/Appointments/AppointmentFilters";
import AppointmentDetail from "components/Appointments/AppointmentDetail";
import Pagination from "components/Common/Pagination";
import PageHeader from "../../components/Common/PageHeader"; 
// Hooks
import {
  useCreateAppointment,
  useCancelAppointment,
  useUpdateAppointment,
  useUpdateAppointmentStatus,
} from "hooks/appointments";
import { useAllAppointments } from "hooks/appointments/useAllAppointments";
import { useAppointmentsSearch } from "hooks/appointments/useAppointmentsSearch";
// ✅ NUEVO: Definición de tipo para citas pendientes
interface PendingAppointment {
  id: number;
  patient_name?: string;
  tentative_date?: string;
  tentative_time?: string;
  doctor_service_name?: string;
}
export default function Appointments() {
  // ✅ CAMBIO: Usar IDs en lugar de objetos completos
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [viewingAppointmentId, setViewingAppointmentId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const listRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  // ✅ CAMBIO: Estado tipado correctamente
  const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  
  // ✅ NUEVO: Leer parámetro ?view= de la URL para abrir modal directamente
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get("view");
    if (viewParam) {
      const appointmentId = parseInt(viewParam, 10);
      if (!isNaN(appointmentId)) {
        setViewingAppointmentId(appointmentId);
        // Limpiar la URL sin recargar
        window.history.replaceState({}, "", "/appointments");
      }
    }
  }, [location.search]);
  
  // 1. DATA LOADING
  const { data: allData, isLoading, isFetching, error } = useAllAppointments();
  const allAppointments = allData?.list ?? [];
  
  // ✅ NUEVO: Fetch de citas pendientes (solo para doctores/admin)
  useEffect(() => {
    const fetchPendingAppointments = async () => {
      setIsLoadingPending(true);
      try {
        // Asumiendo que hay un endpoint para doctores
        // Nota: Ajustar la URL si es necesario (ej. /api/doctor/appointments/?status=tentative)
        const response = await axios.get<PendingAppointment[]>('doctor/appointments/?status=tentative');
        setPendingAppointments(response.data);
      } catch (error) {
        console.error("Error fetching pending appointments:", error);
      } finally {
        setIsLoadingPending(false);
      }
    };
    
    // Solo fetch si el usuario es doctor/admin (ajustar lógica según autenticación)
    // Por ahora, ejecutamos siempre para demostración
    fetchPendingAppointments();
  }, []);
  
  // 2. SEARCH LOADING
  const { data: searchResults = [], isLoading: isSearching } = useAppointmentsSearch(search);
  
  // 3. MUTATIONS
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const cancelMutation = useCancelAppointment();
  const statusMutation = useUpdateAppointmentStatus();
  
  // Métricas para el PageHeader
  const todayStr = moment().format("YYYY-MM-DD");
  const appointmentsToday = allAppointments.filter(a => a.appointment_date.startsWith(todayStr)).length;
  const pendingCount = allAppointments.filter(a => a.status === 'pending').length;
  
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, selectedDate]);
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get("status") as AppointmentStatus | null;
    if (statusParam) {
      setStatusFilter(statusParam);
      setTimeout(() => {
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [location.search]);
  
  const saveAppointment = (data: AppointmentInput, id?: number) => {
    if (id) {
      updateMutation.mutate({ id, data });
      setEditingAppointmentId(null);
    } else {
      createMutation.mutate(data);
      setShowCreateForm(false);
    }
  };
  
  const isSearchingActive = search.trim().length > 0;
  const localFiltered = allAppointments
    .filter((appt) => 
      selectedDate ? moment(appt.appointment_date).isSame(selectedDate, "day") : true
    )
    .filter((appt) => (statusFilter === "all" ? true : appt.status === statusFilter))
    .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date));
  const finalAppointments = isSearchingActive ? searchResults : localFiltered;
  const totalItems = finalAppointments.length;
  const paginatedAppointments = isSearchingActive 
    ? finalAppointments 
    : finalAppointments.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  // ✅ NUEVO: Función para confirmar cita
  const handleConfirmAppointment = async (orderId: number) => {
    try {
      // Llamar al endpoint de confirmación
      await axios.post(`doctor/appointments/${orderId}/confirm/`);
      
      // Actualizar lista local eliminando la cita confirmada
      setPendingAppointments(prev => prev.filter((app: PendingAppointment) => app.id !== orderId));
      
      // Opcional: Recargar todas las citas para reflejar el cambio
      // (Depende de si useAllAppointments se actualiza automáticamente)
    } catch (error) {
      console.error("Error confirming appointment:", error);
      alert("Error al confirmar la cita");
    }
  };
  if (error) return (
    <div className="p-10 border border-red-500 bg-red-500/10 text-red-500 font-mono text-xs uppercase">
      Critical_Data_Link_Failure // Error loading appointments
    </div>
  );
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
        
      {/* HEADER ELITE */}
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "APPOINTMENTS", active: true }
        ]}
        stats={[
          { 
            label: "Daily_Load", 
            value: appointmentsToday 
          },
          { 
            label: "Global_Pending", 
            value: pendingCount,
            color: pendingCount > 0 ? "text-amber-500" : "text-white/40"
          },
          { 
            label: "Sync_Status", 
            value: isLoading ? "INIT" : "READY",
            color: isLoading ? "animate-pulse text-amber-500" : "text-emerald-500"
          }
        ]}
        actions={
          <div className="flex bg-[#111] border border-white/10 p-1 rounded-sm shadow-xl">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2.5 rounded-sm transition-all border border-white/5 active:scale-[0.98]"
            >
              <PlusIcon className="w-4 h-4 opacity-50" />
              NEW APPOINMENT
            </button>
          </div>
        }
      />
      {/* ✅ NUEVO: SECCIÓN DE CITAS PENDIENTES (CONFIRMACIÓN) */}
      <div className="border border-amber-500/30 bg-[#0a0a0b] backdrop-blur-md p-4 space-y-4 rounded-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-amber-500/20 pb-3">
          <CheckCircleIcon className="w-4 h-4 text-amber-400" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
            CITAS PENDIENTES POR CONFIRMACIÓN
          </h2>
          <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded-full ml-auto">
            {pendingAppointments.length}
          </span>
        </div>
        
        {isLoadingPending ? (
          <div className="text-center py-4 text-white/50">Cargando citas pendientes...</div>
        ) : pendingAppointments.length > 0 ? (
          <div className="grid gap-2 max-h-48 overflow-y-auto">
            {pendingAppointments.map((app) => (
              <div key={app.id} className="flex justify-between items-center bg-white/5 p-3 rounded-sm hover:bg-white/10 transition-colors">
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{app.patient_name || 'Paciente'}</p>
                  <div className="flex gap-4 mt-1 text-xs text-white/50">
                    <span>{app.tentative_date} - {app.tentative_time}</span>
                    <span>{app.doctor_service_name}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleConfirmAppointment(app.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded-sm hover:bg-emerald-500 hover:text-black transition-all"
                >
                  <CheckCircleIcon className="w-3 h-3" />
                  Confirmar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/50 text-sm text-center py-4">No hay citas pendientes por confirmar.</p>
        )}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
         {/* COLUMNA IZQUIERDA: CALENDARIO */}
         <div className="xl:col-span-5 space-y-6">
           <section className="border border-white/10 bg-[#0a0a0b] backdrop-blur-md p-4 rounded-sm shadow-inner">
             <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
               <ChartBarIcon className="w-4 h-4 text-white/40" />
               <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Temporal_Heatmap</h2>
             </div>
             <CalendarGrid
               appointments={allAppointments} 
               onSelectDate={(date: Date) => setSelectedDate(date)}
               onSelectAppointment={(appt: Appointment) => setViewingAppointmentId(appt.id)}
             />
           </section>
         </div>
         
         {/* COLUMNA DERECHA: LISTA Y CONTROLES */}
         <div className="xl:col-span-7 space-y-4" ref={listRef}>
           <div className="border border-white/10 bg-[#0a0a0b] backdrop-blur-md p-4 space-y-4 rounded-sm">
             <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
               <div className="flex items-center gap-3">
                 <FunnelIcon className="w-4 h-4 text-white/40" />
                 <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
                   {selectedDate ? `Filter: ${moment(selectedDate).format("DD_MMM")}` : "Global_Registry"}
                 </h2>
                 {selectedDate && (
                   <button onClick={() => setSelectedDate(null)} className="text-[8px] border border-red-500/30 text-red-500 px-2 py-0.5 hover:bg-red-500 hover:text-white transition-all font-mono">
                     CLEAR_DATE
                   </button>
                 )}
               </div>
               {!isSearchingActive && (
                 <AppointmentFilters activeFilter={statusFilter} onFilterChange={setStatusFilter} />
               )}
             </div>
             <div className="relative group">
               <MagnifyingGlassIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearching ? 'text-white animate-pulse' : 'text-white/20'}`} />
               <input
                 type="text"
                 placeholder="SEARCH_BY_PATIENT_OR_ID..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full bg-black/40 border border-white/10 pl-10 pr-10 py-3 text-[11px] font-mono tracking-widest focus:border-white/30 outline-none transition-all placeholder:text-white/10 uppercase rounded-sm"
               />
               {(isSearching || isFetching) && (
                 <ArrowPathIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 animate-spin" />
               )}
             </div>
           </div>
           <div className="border border-white/10 bg-[#0a0a0b]/40 overflow-hidden min-h-[450px] rounded-sm">
             <AppointmentsList
               appointments={paginatedAppointments}
               onEdit={(a: Appointment) => setViewingAppointmentId(a.id)}
               onDelete={() => {}}
               onStatusChange={(id: number, status: AppointmentStatus) => statusMutation.mutate({ id, status })}
             />
           </div>
           {/* PAGINACIÓN TÉCNICA */}
           {!isSearchingActive && totalItems > 0 && (
             <div className="border border-white/10 bg-[#0a0a0b] backdrop-blur-md px-4 py-3 flex justify-between items-center rounded-sm">
               <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                 Data_Slice: <span className="text-white/80">{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)}</span> // Total: {totalItems}
               </div>
               <Pagination
                 currentPage={currentPage}
                 totalItems={totalItems}
                 pageSize={pageSize}
                 onPageChange={setCurrentPage}
               />
             </div>
           )}
         </div>
        </div>
        {/* MODALS */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0b] border border-white/10 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <AppointmentForm onSubmit={(data) => saveAppointment(data)} onClose={() => setShowCreateForm(false)} />
            </div>
          </div>
        )}
        {viewingAppointmentId && (
          <AppointmentDetail
            appointmentId={viewingAppointmentId}
            onClose={() => setViewingAppointmentId(null)}
            onEdit={(id: number) => { setViewingAppointmentId(null); setEditingAppointmentId(id); }}
          />
        )}
        {editingAppointmentId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0a0a0b] border border-white/10 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <AppointmentEditForm
                appointmentId={editingAppointmentId}
                onSubmit={(id, data) => saveAppointment(data, id)}
                onClose={() => setEditingAppointmentId(null)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }