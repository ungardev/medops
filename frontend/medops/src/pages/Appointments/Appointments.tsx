// src/pages/Appointments/Appointments.tsx
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import moment from "moment";
import { Appointment, AppointmentInput, AppointmentStatus } from "types/appointments";
import { OperationalItem } from "@/types/operational";
import { DoctorService } from "@/types/services";
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ListBulletIcon
} from "@heroicons/react/24/outline";
import ServiceItemsList from "@/components/Appointments/ServiceItemsList";
import AppointmentForm from "components/Appointments/AppointmentForm";
import AppointmentEditForm from "components/Appointments/AppointmentEditForm";
import CalendarGrid from "components/Appointments/CalendarGrid";
import ServiceStatusFilters from "@/components/Appointments/ServiceStatusFilters"; // ✅ CAMBIO: Nuevo componente
import AppointmentDetail from "components/Appointments/AppointmentDetail";
import Pagination from "components/Common/Pagination";
import PageHeader from "../../components/Common/PageHeader";
import {
  useCreateAppointment,
  useCancelAppointment,
  useUpdateAppointment,
  useUpdateAppointmentStatus,
} from "hooks/appointments";
import { useScheduledItems } from "hooks/appointments/useScheduledItems";
import { useAppointmentsSearch } from "hooks/appointments/useAppointmentsSearch";
import { useCalendarTimeline } from "@/hooks/operational/useOperationalHub";
import { useAllServiceSchedules } from '@/hooks/services/useAllServiceSchedules';
import { generateAvailabilityFromSchedules } from '@/utils/scheduleUtils';
import DayDetailsPanel from '@/components/Appointments/DayDetailsPanel';
import { useDoctorServices } from "@/hooks/services/useDoctorServices"; // ✅ CAMBIO: Import correcto
export default function Appointments() {
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [viewingAppointmentId, setViewingAppointmentId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const pageSize = 10;
  const listRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const institutionId = 1;
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const viewParam = params.get("view");
    if (viewParam) {
      const appointmentId = parseInt(viewParam, 10);
      if (!isNaN(appointmentId)) {
        setViewingAppointmentId(appointmentId);
        window.history.replaceState({}, "", "/appointments");
      }
    }
  }, [location.search]);
  
  const { 
    data: hubData, 
    isLoading: isLoadingOperational,
    isFetching: isFetchingOperational 
  } = useCalendarTimeline(institutionId, currentMonth);
  
  const operationalItems = hubData?.timeline || [];
  
  const { data: serviceSchedules = [] } = useAllServiceSchedules(institutionId);
  const generatedAvailability = generateAvailabilityFromSchedules(serviceSchedules, currentMonth);
  const operationalItemsWithAvailability = [...operationalItems, ...generatedAvailability];
  
  const operationalStats = hubData?.stats || {
    total_items: operationalItemsWithAvailability.length,
    appointments_count: operationalItemsWithAvailability.filter(i => i.type === 'appointment').length,
    availability_count: operationalItemsWithAvailability.filter(i => i.type === 'availability').length,
    dates_with_activity: 0,
    avg_items_per_day: 0,
    period_days: 0
  };
  
  const { data: allData, isLoading, isFetching, error } = useScheduledItems();
  const allAppointments = allData ?? [];
  
  // ✅ CAMBIO: Usar useDoctorServices() en lugar de useDoctorServicesSearch('')
  const { data: serviceResults = [] } = useDoctorServices();
  
  // ✅ CAMBIO: Determinar tipo de servicio seleccionado (usando category_name)
  const selectedServiceType = selectedServiceId 
    ? (() => {
        const service = serviceResults.find(s => s.id === selectedServiceId);
        const categoryName = service?.category_name?.toLowerCase() || '';
        
        if (categoryName.includes('consulta')) return 'APPOINTMENT';
        if (categoryName.includes('procedimiento')) return 'PROCEDURE';
        if (categoryName.includes('diagnostico')) return 'DIAGNOSTIC';
        if (categoryName.includes('farmacia') || categoryName.includes('medicamento')) return 'PHARMACY';
        if (categoryName.includes('paquete') || categoryName.includes('promocion')) return 'PACKAGE';
        return 'APPOINTMENT'; // Default
      })()
    : 'APPOINTMENT';
  
  const { data: searchResults = [], isLoading: isSearching } = useAppointmentsSearch(search);
  
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const cancelMutation = useCancelAppointment();
  const statusMutation = useUpdateAppointmentStatus();
  
  const todayStr = moment().format("YYYY-MM-DD");
  const appointmentsToday = allAppointments.filter(a => a.appointment_date.startsWith(todayStr)).length;
  const pendingCount = allAppointments.filter(a => a.status === 'pending' || a.status === 'tentative').length;
  
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
  
  const handleConfirmAppointment = async (appointmentId: number) => {
    try {
      await fetch(`/api/appointments/${appointmentId}/confirm/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Error confirming appointment:", error);
      alert("Error al confirmar la cita");
    }
  };
  
  const goToPrevMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  const handleItemClick = (item: OperationalItem) => {
    if (item.type === 'appointment' && typeof item.id === 'number') {
      setViewingAppointmentId(item.id);
    } else if (item.type === 'availability') {
      const slotDate = new Date(item.date);
      if (item.time) {
        const [hours, minutes] = item.time.split(':').map(Number);
        slotDate.setHours(hours, minutes);
      }
      setSelectedDate(slotDate);
      setShowCreateForm(true);
    }
  };
  
  const selectedDayItems = selectedDate
    ? operationalItemsWithAvailability.filter(item => 
        moment(item.date).isSame(selectedDate, 'day')
      )
    : [];
  
  const filteredAppointmentsForDay = selectedDate
    ? allAppointments.filter(appt => 
        moment(appt.appointment_date).isSame(selectedDate, "day") &&
        (statusFilter === "all" || appt.status === statusFilter)
      )
    : [];
  
  if (error) return (
    <div className="p-10 border border-red-500 bg-red-500/10 text-red-500 font-mono text-xs uppercase">
      Critical_Data_Link_Failure // Error loading appointments
    </div>
  );
  
  // ✅ CAMBIO: Determinar items para la lista
  const itemsForList = selectedDate ? selectedDayItems : operationalItemsWithAvailability;
  
  return (
    <div className="max-w-[1800px] mx-auto p-4 lg:p-6 space-y-6 h-screen flex flex-col">
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
            value: isLoadingOperational ? "INIT" : "READY",
            color: isLoadingOperational ? "animate-pulse text-amber-500" : "text-emerald-500"
          }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex bg-[#111] border border-white/10 p-1 rounded-sm">
              <button
                onClick={() => setViewMode("calendar")}
                className={`p-2 rounded-sm transition-all ${
                  viewMode === "calendar" 
                    ? "bg-white/10 text-white" 
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <CalendarDaysIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-sm transition-all ${
                  viewMode === "list" 
                    ? "bg-white/10 text-white" 
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
            </div>
            
            {/* ✅ CAMBIO: Botón NEW con pre-selección de servicio */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-sm transition-all border border-white/5 active:scale-[0.98]"
            >
              <PlusIcon className="w-4 h-4 opacity-50" />
              NEW
            </button>
          </div>
        }
      />
      
      {/* ✅ FIX: Layout Grid para equilibrar Buscador y Botones de Filtro */}
      <div className="grid grid-cols-12 gap-4 items-center bg-[#0a0a0b] border border-white/10 p-3 rounded-sm">
        {/* Buscador: 4 de 12 columnas (33.33%) */}
        <div className="col-span-4 relative group">
          <MagnifyingGlassIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearching ? 'text-white animate-pulse' : 'text-white/30'}`} />
          <input
            type="text"
            placeholder="SEARCH_PATIENT_OR_ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 pl-10 pr-10 py-2 text-[11px] font-mono tracking-widest focus:border-white/30 outline-none transition-all placeholder:text-white/30 text-white uppercase rounded-sm"
          />
          {(isSearching || isFetching) && (
            <ArrowPathIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 animate-spin" />
          )}
        </div>
        
        {/* Botones de filtro: 7 de 12 columnas (58.33%) */}
        <div className="col-span-7">
          <ServiceStatusFilters
            categoryType={selectedServiceType}
            activeFilter={statusFilter}
            onFilterChange={(status: string) => setStatusFilter(status as AppointmentStatus | "all")}
          />
        </div>
        
        {/* Fecha seleccionada: 1 de 12 columnas (8.33%) */}
        <div className="col-span-1">
          {selectedDate && (
            <div className="flex items-center gap-2 bg-[#111] border border-white/10 px-3 py-1.5 rounded-sm">
              <span className="text-[10px] text-white/60">
                {moment(selectedDate).format("DD MMM")}
              </span>
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-[10px] text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* ✅ NUEVO: Layout de dos columnas (70/30) responsive */}
      <div className="flex flex-col lg:flex-row h-full gap-4 flex-1 min-h-0">
        {/* Columna Izquierda: Calendario (70% en lg, 100% en móvil) */}
        <div className="lg:w-7/12 w-full bg-[#0a0a0b] border border-white/10 rounded-sm p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4 text-white/40" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                TEMPORAL_HEATMAP
              </h2>
            </div>
            <div className="text-[9px] text-white/40 font-mono">
              {viewMode === "calendar" ? "VISTA_CALENDARIO" : "VISTA_LISTA"} | 
              Items: {operationalStats.total_items} | 
              Citas: {operationalStats.appointments_count} | 
              Disponibles: {operationalStats.availability_count}
            </div>
          </div>
          
          <div className="flex-1 min-h-0">
            <CalendarGrid
              appointments={allAppointments}
              operationalItems={operationalItemsWithAvailability}
              currentDate={currentMonth}
              statusFilter={statusFilter}
              selectedServiceId={selectedServiceId} // ✅ CAMBIO: Pasar filtro de servicio
              onSelectDate={(date: Date) => setSelectedDate(date)}
              onSelectAppointment={(appt: Appointment) => setViewingAppointmentId(appt.id)}
              onOperationalItemClick={handleItemClick}
              onPrevMonth={goToPrevMonth}
              onNextMonth={goToNextMonth}
            />
          </div>
        </div>
        
        {/* Columna Derecha: Filtros + Lista (30% en lg, 100% en móvil) */}
        <div className="lg:w-5/12 w-full flex flex-col gap-4">
          {/* Panel de Detalles del Día (si hay día seleccionado) */}
          {selectedDate && (
            <div className="h-1/3 min-h-[200px]">
              <DayDetailsPanel
                day={selectedDate}
                items={selectedDayItems}
                onItemClick={handleItemClick}
              />
            </div>
          )}
          
          {/* Lista de Items Operacionales del Día Seleccionado */}
          <div className={`flex-1 bg-[#0a0a0b] border border-white/10 rounded-sm p-4 overflow-y-auto ${selectedDate ? 'h-2/3' : 'h-full'}`}>
            <ServiceItemsList
              items={itemsForList} // ✅ CAMBIO: Usar itemsForList
              services={serviceResults}
              selectedServiceId={selectedServiceId}
              statusFilter={statusFilter}
              onServiceChange={setSelectedServiceId}
              onAppointmentClick={(a: Appointment) => setViewingAppointmentId(a.id)}
              onItemClick={handleItemClick}
              onEdit={(a: Appointment) => setViewingAppointmentId(a.id)}
              onDelete={(item: OperationalItem) => {
                console.log('Eliminar item:', item);
              }}
              onStatusChange={(id: number, status: AppointmentStatus) => statusMutation.mutate({ id, status })}
            />
            
            {/* Paginación solo si no hay día seleccionado */}
            {!selectedDate && !isSearchingActive && totalItems > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
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
      </div>
      
      {/* Modales y Formularios */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <AppointmentForm 
              date={selectedDate || undefined}
              preselectedServiceId={selectedServiceId ?? undefined} // ✅ CORRECCIÓN: Convertir null a undefined
              onSubmit={(data) => saveAppointment(data)} 
              onClose={() => setShowCreateForm(false)} 
            />
          </div>
        </div>
      )}
      
      {viewingAppointmentId !== null && (
        <AppointmentDetail
          appointmentId={viewingAppointmentId}
          onClose={() => setViewingAppointmentId(null)}
          onEdit={(id: number) => { setViewingAppointmentId(null); setEditingAppointmentId(id); }}
        />
      )}
      
      {editingAppointmentId !== null && (
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