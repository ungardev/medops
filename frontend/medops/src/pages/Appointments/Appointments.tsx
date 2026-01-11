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
import PageHeader from "../../components/Common/PageHeader"; // ✅ Integrado

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

  // 1. DATA LOADING
  const { data: allData, isLoading, isFetching, error } = useAllAppointments();
  const allAppointments = allData?.list ?? [];

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

  if (error) return (
    <div className="p-10 border border-red-500 bg-red-500/10 text-red-500 font-mono text-xs uppercase">
      Critical_Data_Link_Failure // Error loading appointments
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      
      {/* HEADER ESTANDARIZADO CON STATS DINÁMICOS */}
      <PageHeader 
        title="Registry Manager" 
        breadcrumb="MEDOPS // CENTRAL_APPOINTMENT_MATRIX"
        stats={[
          { 
            label: "Daily_Load", 
            value: appointmentsToday 
          },
          { 
            label: "Global_Pending", 
            value: pendingCount,
            color: pendingCount > 0 ? "text-amber-500" : "text-[var(--palantir-muted)]"
          },
          { 
            label: "Sync_Status", 
            value: isLoading ? "INIT" : "READY",
            color: isLoading ? "animate-pulse text-amber-500" : "text-emerald-500"
          }
        ]}
        actions={
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-[var(--palantir-active)] hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2.5 rounded-sm transition-all shadow-lg shadow-blue-500/10"
          >
            <PlusIcon className="w-4 h-4" />
            New_Mission_Record
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: CALENDARIO */}
        <div className="xl:col-span-5 space-y-6">
          <section className="border border-[var(--palantir-border)] bg-[var(--palantir-surface)] p-4 rounded-sm shadow-inner">
            <div className="flex items-center gap-2 mb-4 border-b border-[var(--palantir-border)]/30 pb-3">
              <ChartBarIcon className="w-4 h-4 text-[var(--palantir-active)]" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--palantir-text)]">Temporal_Heatmap</h2>
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
          <div className="border border-[var(--palantir-border)] bg-[var(--palantir-surface)] p-4 space-y-4 rounded-sm">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
              <div className="flex items-center gap-3">
                <FunnelIcon className="w-4 h-4 text-[var(--palantir-active)]" />
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
              <MagnifyingGlassIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearching ? 'text-[var(--palantir-active)] animate-pulse' : 'text-[var(--palantir-muted)]'}`} />
              <input
                type="text"
                placeholder="SEARCH_BY_PATIENT_OR_ID... (BACKEND_QUERY)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/20 border border-[var(--palantir-border)] pl-10 pr-10 py-3 text-[11px] font-mono tracking-widest focus:border-[var(--palantir-active)] outline-none transition-all placeholder:text-[var(--palantir-muted)]/30 uppercase rounded-sm"
              />
              {(isSearching || isFetching) && (
                <ArrowPathIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--palantir-active)] animate-spin" />
              )}
            </div>
          </div>

          <div className="border border-[var(--palantir-border)] bg-black/10 overflow-hidden min-h-[450px] rounded-sm">
            <AppointmentsList
              appointments={paginatedAppointments}
              onEdit={(a: Appointment) => setViewingAppointment(a)}
              onDelete={(id: number) => deleteAppointmentSafe(id)}
              onStatusChange={(id: number, status: AppointmentStatus) => statusMutation.mutate({ id, status })}
            />
          </div>

          {/* PAGINACIÓN TÉCNICA */}
          {!isSearchingActive && totalItems > 0 && (
            <div className="border border-[var(--palantir-border)] bg-[var(--palantir-surface)] px-4 py-3 flex justify-between items-center rounded-sm">
              <div className="text-[10px] font-mono text-[var(--palantir-muted)] uppercase tracking-widest">
                Data_Slice: <span className="text-[var(--palantir-text)]">{(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalItems)}</span> // Total: {totalItems}
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
