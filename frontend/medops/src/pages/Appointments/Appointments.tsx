// src/pages/Appointments/Appointments.tsx
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import moment from "moment";
import { Appointment, AppointmentInput, AppointmentStatus } from "types/appointments";
import { OperationalItem } from "@/types/operational";
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ListBulletIcon
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
import { useScheduledItems } from "hooks/appointments/useScheduledItems";
import { useAppointmentsSearch } from "hooks/appointments/useAppointmentsSearch";
import { useCalendarItems } from "@/hooks/operational/useOperationalHub"; // NUEVO: Hook unificado
export default function Appointments() {
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [viewingAppointmentId, setViewingAppointmentId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const pageSize = 10;
  const listRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  // Navegación de meses
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // ID de institución (debería venir de contexto o localStorage)
  const institutionId = 1; // 🔴 CAMBIAR: Obtener dinámicamente
  
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
  // ✅ NUEVO: Datos unificados para calendario (DoctorService paradigm)
  const { data: operationalItems = [], isLoading: isLoadingOperational } = useCalendarItems(institutionId, currentMonth);
  
  // Datos legacy para lista y filtros
  const { data: allData, isLoading, isFetching, error } = useScheduledItems();
  const allAppointments = allData ?? [];
  
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
  if (error) return (
    <div className="p-10 border border-red-500 bg-red-500/10 text-red-500 font-mono text-xs uppercase">
      Critical_Data_Link_Failure // Error loading appointments
    </div>
  );
  return (
    <div className="max-w-[1800px] mx-auto p-4 lg:p-6 space-y-6">
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
            value: isLoadingOperational ? "INIT" : "READY",
            color: isLoadingOperational ? "animate-pulse text-amber-500" : "text-emerald-500"
          }
        ]}
        actions={
          <div className="flex items-center gap-2">
            {/* Toggle View Mode */}
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
            
            {/* New Appointment Button */}
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
      
      {/* CONTROLS BAR */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-[#0a0a0b] border border-white/10 p-3 rounded-sm">
        {/* Search */}
        <div className="relative group flex-1 max-w-md">
          <MagnifyingGlassIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearching ? 'text-white animate-pulse' : 'text-white/20'}`} />
          <input
            type="text"
            placeholder="SEARCH_PATIENT_OR_ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 pl-10 pr-10 py-2 text-[11px] font-mono tracking-widest focus:border-white/30 outline-none transition-all placeholder:text-white/10 uppercase rounded-sm"
          />
          {(isSearching || isFetching) && (
            <ArrowPathIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 animate-spin" />
          )}
        </div>
        
        {/* Filters */}
        <AppointmentFilters activeFilter={statusFilter} onFilterChange={setStatusFilter} />
        
        {/* Date Filter */}
        {selectedDate && (
          <div className="flex items-center gap-2 bg-[#111] border border-white/10 px-3 py-1.5 rounded-sm">
            <span className="text-[10px] text-white/60">
              {moment(selectedDate).format("DD MMM YYYY")}
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
      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* CALENDAR COLUMN */}
        <div className="xl:col-span-7 space-y-4">
          <section className="border border-white/10 bg-[#0a0a0b] backdrop-blur-md p-4 rounded-sm shadow-inner">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4 text-white/40" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  TEMPORAL_HEATMAP
                </h2>
              </div>
              <div className="text-[9px] text-white/40 font-mono">
                {viewMode === "calendar" ? "VISTA_CALENDARIO" : "VISTA_LISTA"}
              </div>
            </div>
            
            {/* ✅ PASO CLAVE: Usar datos unificados (Operational Items) */}
            <CalendarGrid
              appointments={allAppointments}
              operationalItems={operationalItems}
              currentDate={currentMonth}
              onSelectDate={(date: Date) => setSelectedDate(date)}
              onSelectAppointment={(appt: Appointment) => setViewingAppointmentId(appt.id)}
              onPrevMonth={goToPrevMonth}
              onNextMonth={goToNextMonth}
            />
          </section>
        </div>
        {/* LIST COLUMN */}
        <div className="xl:col-span-5 space-y-4 relative" style={{ isolation: 'isolate' }} ref={listRef}>
          <div className="border border-white/10 bg-[#0a0a0b] backdrop-blur-md p-4 rounded-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListBulletIcon className="w-4 h-4 text-white/40" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  {selectedDate ? `DAY_REGISTRY` : "GLOBAL_REGISTRY"}
                </h2>
              </div>
              <div className="text-[9px] text-white/40 font-mono">
                {paginatedAppointments.length} / {totalItems}
              </div>
            </div>
            
            <div className="space-y-2">
              <AppointmentsList
                appointments={paginatedAppointments}
                onEdit={(a: Appointment) => setViewingAppointmentId(a.id)}
                onDelete={() => {}}
                onStatusChange={(id: number, status: AppointmentStatus) => statusMutation.mutate({ id, status })}
              />
            </div>
          </div>
          
          {/* PAGINATION */}
          {!isSearchingActive && totalItems > 0 && (
            <div className="border border-white/10 bg-[#0a0a0b] backdrop-blur-md px-4 py-3 flex justify-between items-center rounded-sm">
              <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                Data_Slice: <span className="text-white/80">{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)}</span>
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