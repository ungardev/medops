// src/pages/Appointments/Appointments.tsx
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import moment from "moment";
import { Appointment, AppointmentInput, AppointmentStatus } from "types/appointments";
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ChartBarIcon, 
  ArrowPathIcon 
} from "@heroicons/react/24/outline";

// Componentes
import AppointmentsList from "components/Appointments/AppointmentsList";
import AppointmentForm from "components/Appointments/AppointmentForm";
import AppointmentEditForm from "components/Appointments/AppointmentEditForm";
import CalendarGrid from "components/Appointments/CalendarGrid";
import AppointmentFilters from "components/Appointments/AppointmentFilters";
import AppointmentDetail from "components/Appointments/AppointmentDetail";
import Pagination from "components/Common/Pagination";

// Hooks
import {
  useCreateAppointment,
  useCancelAppointment,
  useUpdateAppointment,
  useUpdateAppointmentStatus,
} from "hooks/appointments";
import { useAllAppointments } from "hooks/appointments/useAllAppointments";
import { useAppointmentsSearch } from "hooks/appointments/useAppointmentsSearch";

export default function Appointments() {
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const listRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // 1. DATA LOADING: Universo completo para el Calendario
  const { data: allData, isLoading, isFetching, error } = useAllAppointments();
  const allAppointments = allData?.list ?? [];

  // 2. SEARCH LOADING: Búsqueda específica en Backend
  const { data: searchResults = [], isLoading: isSearching } = useAppointmentsSearch(search);

  // 3. MUTATIONS
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const cancelMutation = useCancelAppointment();
  const statusMutation = useUpdateAppointmentStatus();

  // Reset de página al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, selectedDate]);

  // Manejo de parámetros de URL
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
      setEditingAppointment(null);
    } else {
      createMutation.mutate(data);
      setShowCreateForm(false);
    }
  };

  const deleteAppointmentSafe = (id: number) => {
    if (window.confirm("CONFIRM_ACTION: ELIMINATE_RECORD_PERMANENTLY?")) {
      cancelMutation.mutate(id);
    }
  };

  // ============================================================
  // 🔍 LÓGICA DE FILTRADO Y PAGINACIÓN
  // ============================================================
  const isSearchingActive = search.trim().length > 0;

  // Filtrado Local (Se aplica cuando NO hay búsqueda activa)
  const localFiltered = allAppointments
    .filter((appt) => 
      selectedDate ? moment(appt.appointment_date).isSame(selectedDate, "day") : true
    )
    .filter((appt) => (statusFilter === "all" ? true : appt.status === statusFilter))
    .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date));

  // Selección de Data Final
  const finalAppointments = isSearchingActive ? searchResults : localFiltered;
  
  // Paginación: Solo si no estamos buscando (para ver todo el resultado de búsqueda de golpe)
  const totalItems = finalAppointments.length;
  const paginatedAppointments = isSearchingActive 
    ? finalAppointments 
    : finalAppointments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (error) return (
    <div className="p-10 border border-red-500 bg-red-500/10 text-red-500 font-mono text-xs uppercase">
      Critical_Data_Link_Failure // Error loading appointments
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--palantir-bg)] text-[var(--palantir-text)] p-4 sm:p-8 space-y-6">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--palantir-border)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full animate-pulse ${(isFetching || isSearching) ? 'bg-amber-500' : 'bg-[var(--palantir-active)]'}`} />
            <span className="text-[10px] font-black text-[var(--palantir-active)] uppercase tracking-[0.4em]">
              Central_Appointment_Matrix
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">Registry_Manager</h1>
          <p className="text-[10px] font-mono text-[var(--palantir-muted)] mt-1 uppercase tracking-widest">
            {moment().format("YYYY-MM-DD // HH:mm:ss")} // DB_SYNC: {isLoading ? 'INITIALIZING' : 'READY'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="group flex items-center gap-3 bg-[var(--palantir-active)] hover:bg-blue-600 text-white px-6 py-3 shadow-[0_0_20px_rgba(30,136,229,0.3)] transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest">New_Mission_Record</span>
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: CALENDARIO (Usa ALL DATA) */}
        <div className="xl:col-span-5 space-y-6">
          <section className="border border-[var(--palantir-border)] bg-black/20 p-4">
            <div className="flex items-center gap-2 mb-4">
              <ChartBarIcon className="w-4 h-4 text-[var(--palantir-active)]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">Temporal_Heatmap</h2>
            </div>
            <CalendarGrid
              appointments={allAppointments} 
              onSelectDate={(date: Date) => setSelectedDate(date)}
              onSelectAppointment={(appt: Appointment) => setViewingAppointment(appt)}
            />
          </section>
        </div>

        {/* COLUMNA DERECHA: LISTA Y CONTROLES */}
        <div className="xl:col-span-7 space-y-4" ref={listRef}>
          <div className="border border-[var(--palantir-border)] bg-black/20 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex items-center gap-3">
                <FunnelIcon className="w-4 h-4 text-[var(--palantir-active)]" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {selectedDate ? `Filter: ${moment(selectedDate).format("DD_MMM")}` : "Global_Registry"}
                </h2>
                {selectedDate && (
                  <button onClick={() => setSelectedDate(null)} className="text-[8px] border border-red-500/30 text-red-500 px-2 py-0.5 hover:bg-red-500 hover:text-white transition-all">
                    CLEAR_DATE
                  </button>
                )}
              </div>
              {!isSearchingActive && (
                <AppointmentFilters activeFilter={statusFilter} onFilterChange={setStatusFilter} />
              )}
            </div>

            <div className="relative group">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--palantir-muted)] group-focus-within:text-[var(--palantir-active)]" />
              <input
                type="text"
                placeholder="SEARCH_BY_PATIENT_OR_ID... (BACKEND_QUERY)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/40 border border-[var(--palantir-border)] pl-10 pr-4 py-3 text-xs font-mono tracking-widest focus:border-[var(--palantir-active)] outline-none transition-all placeholder:text-[var(--palantir-muted)]/50 uppercase"
              />
              {(isSearching || isFetching) && (
                <ArrowPathIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--palantir-active)] animate-spin" />
              )}
            </div>
          </div>

          <div className="border border-[var(--palantir-border)] bg-black/10 overflow-hidden min-h-[400px]">
            <AppointmentsList
              appointments={paginatedAppointments}
              onEdit={(a: Appointment) => setViewingAppointment(a)}
              onDelete={(id: number) => deleteAppointmentSafe(id)}
              onStatusChange={(id: number, status: AppointmentStatus) => statusMutation.mutate({ id, status })}
            />
          </div>

          {/* PAGINACIÓN INSTITUCIONAL */}
          {!isSearchingActive && totalItems > 0 && (
            <div className="border border-[var(--palantir-border)] bg-black/20 px-4 py-3 flex justify-between items-center">
              <div className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
                Data_Slice: {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalItems)} / {totalItems}
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
        <AppointmentForm onSubmit={(data) => saveAppointment(data)} onClose={() => setShowCreateForm(false)} />
      )}
      {viewingAppointment && (
        <AppointmentDetail
          appointment={viewingAppointment}
          onClose={() => setViewingAppointment(null)}
          onEdit={(appt: Appointment) => { setViewingAppointment(null); setEditingAppointment(appt); }}
        />
      )}
      {editingAppointment && (
        <AppointmentEditForm
          appointment={editingAppointment}
          onSubmit={(id, data) => saveAppointment(data, id)}
          onClose={() => setEditingAppointment(null)}
        />
      )}
    </div>
  );
}
