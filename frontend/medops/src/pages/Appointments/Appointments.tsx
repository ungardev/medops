// src/pages/Appointments.tsx
import { useState, useEffect } from "react";
import moment from "moment";
import {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
} from "types/appointments";

import AppointmentsList from "components/Appointments/AppointmentsList";
import AppointmentForm from "components/Appointments/AppointmentForm";
import AppointmentEditForm from "components/Appointments/AppointmentEditForm";
import CalendarGrid from "components/Appointments/CalendarGrid";
import AppointmentFilters from "components/Appointments/AppointmentFilters";
import AppointmentDetail from "components/Appointments/AppointmentDetail";

import {
  useCreateAppointment,
  useCancelAppointment,
  useUpdateAppointment,
  useUpdateAppointmentStatus,
} from "hooks/appointments";

import { useAllAppointments } from "hooks/appointments/useAllAppointments";
import { useAppointmentsSearch } from "hooks/appointments/useAppointmentsSearch";

import Pagination from "components/Common/Pagination";

export default function Appointments() {
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 🔹 Carga completa (calendario + vista ejecutiva)
  const { data: allData, isLoading, isFetching, error } = useAllAppointments();
  const allAppointments = allData?.list ?? [];

  // 🔹 Buscador institucional (backend)
  const {
    data: searchResults = [],
    isLoading: isSearching,
  } = useAppointmentsSearch(search);

  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const cancelMutation = useCancelAppointment();
  const statusMutation = useUpdateAppointmentStatus();

  // ⚔️ Overlay institucional activo desde el inicio
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    if (!isLoading && !isFetching && allAppointments && allAppointments.length > 0) {
      const timeout = setTimeout(() => setShowOverlay(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, isFetching, allAppointments]);

  const saveAppointment = (data: AppointmentInput, id?: number) => {
    if (!window.confirm("¿Desea guardar los cambios de esta cita?")) return;
    if (id) {
      updateMutation.mutate({ id, data });
      setEditingAppointment(null);
    } else {
      createMutation.mutate(data);
      setShowCreateForm(false);
    }
  };

  const deleteAppointmentSafe = (id: number) => {
    if (window.confirm("¿Está seguro de eliminar esta cita?")) {
      cancelMutation.mutate(id);
    }
  };

  // ============================================================
  // 🔍 LÓGICA INSTITUCIONAL DE BÚSQUEDA
  // ============================================================

  const isSearchingActive = search.trim().length > 0;

  // 🔹 Si hay búsqueda → usar backend
  const backendAppointments = searchResults;

  // 🔹 Si NO hay búsqueda → aplicar filtros locales
  const localFilteredAppointments = allAppointments
    .filter((appt) =>
      selectedDate
        ? moment(appt.appointment_date, "YYYY-MM-DD").isSame(selectedDate, "day")
        : true
    )
    .filter((appt) =>
      statusFilter === "all" ? true : appt.status === statusFilter
    )
    .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date));

  // 🔹 Selección final según modo
  const finalAppointments = isSearchingActive
    ? backendAppointments
    : localFilteredAppointments;

  // 🔹 Paginación solo cuando NO hay búsqueda
  const totalItems = isSearchingActive ? finalAppointments.length : localFilteredAppointments.length;

  const paginatedAppointments = isSearchingActive
    ? finalAppointments // sin paginación
    : finalAppointments.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (error) return <p className="text-red-600">Error cargando citas</p>;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 relative">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0d2c53] dark:text-gray-100">Citas</h1>
        <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">
          {moment().format("dddd, DD [de] MMMM YYYY - HH:mm")}
        </p>
      </div>

      {showCreateForm && (
        <AppointmentForm
          onSubmit={(data) => saveAppointment(data)}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {viewingAppointment && (
        <AppointmentDetail
          appointment={viewingAppointment}
          onClose={() => setViewingAppointment(null)}
          onEdit={(appt) => {
            setViewingAppointment(null);
            setEditingAppointment(appt);
          }}
        />
      )}

      {editingAppointment && (
        <AppointmentEditForm
          appointment={editingAppointment}
          onSubmit={(id, data) => saveAppointment(data, id)}
          onClose={() => setEditingAppointment(null)}
        />
      )}

      {/* Vista combinada */}
      <div className="flex flex-col gap-4 sm:gap-6 mt-4 sm:mt-6">
        {/* Calendario */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 bg-white dark:bg-gray-900">
          <h2 className="text-base sm:text-lg font-semibold text-[#0d2c53] dark:text-gray-100 mb-2">Calendario</h2>
          <CalendarGrid
            appointments={allAppointments}
            onSelectDate={(date) => setSelectedDate(date)}
            onSelectAppointment={(appt) => setViewingAppointment(appt)}
          />
        </div>

        {/* Lista ejecutiva */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-[#0d2c53] dark:text-gray-100">
              {selectedDate
                ? `Citas del ${moment(selectedDate).format("DD/MM/YYYY")}`
                : "Todas las Citas"}
            </h2>

            {selectedDate && !isSearchingActive && (
              <button
                onClick={() => setSelectedDate(null)}
                className="px-2 sm:px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                           bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 
                           hover:bg-gray-200 dark:hover:bg-gray-600 transition text-xs sm:text-sm"
              >
                Ver todas
              </button>
            )}
          </div>

          {/* Filtros + Nueva Cita */}
          <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
            {!isSearchingActive && (
              <AppointmentFilters
                activeFilter={statusFilter}
                onFilterChange={setStatusFilter}
              />
            )}

            <button
              onClick={() => setShowCreateForm(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-[#0d2c53] text-white border border-[#0d2c53] hover:bg-[#0b2444] transition-colors text-xs sm:text-sm"
            >
              + Nueva Cita
            </button>
          </div>

          {/* Buscador */}
          <div className="mb-3 sm:mb-4">
            <input
              type="text"
              placeholder="Buscar por paciente, fecha, tipo o nota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                         bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
            />

            {isSearchingActive && (
              <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400 mt-1">
                Mostrando resultados para “{search.trim()}”
              </p>
            )}

            {isSearching && (
              <span className="text-xs sm:text-[#0d2c53] dark:text-gray-400">Buscando…</span>
            )}
          </div>

          <AppointmentsList
            appointments={paginatedAppointments}
            onEdit={(a) => setViewingAppointment(a)}
            onDelete={(id) => deleteAppointmentSafe(id)}
            onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          />

          {/* Paginación solo cuando NO hay búsqueda */}
          {!isSearchingActive && totalItems > 0 && (
            <div className="flex justify-end mt-3 sm:mt-4">
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

      {/* Overlay institucional adaptativo */}
      {showOverlay && (
        <div className="absolute inset-0 bg-white/70 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <span className="text-base text-[#0d2c53] dark:text-white animate-pulse font-semibold">
            Actualizando citas…
          </span>
        </div>
      )}
    </div>
  );
}
