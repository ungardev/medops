import { useState } from "react";
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
import Pagination from "components/Common/Pagination";

export default function Appointments() {
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [search, setSearch] = useState("");

  // 🔹 Estado de paginación institucional (solo para controlar scroll)
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 🔹 Hook global para calendario y lista ejecutiva
  const { data: allData } = useAllAppointments();
  const allAppointments = allData?.list ?? [];

  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const cancelMutation = useCancelAppointment();
  const statusMutation = useUpdateAppointmentStatus();

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

  // 🔹 Filtro local sobre todas las citas (lista ejecutiva)
  const filteredAppointments = allAppointments
    .filter((appt) =>
      selectedDate
        ? moment(appt.appointment_date, "YYYY-MM-DD").isSame(selectedDate, "day")
        : true
    )
    .filter((appt) =>
      statusFilter === "all" ? true : appt.status === statusFilter
    )
    .filter((appt) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        appt.patient.full_name.toLowerCase().includes(term) ||
        appt.appointment_date.includes(term) ||
        (appt.notes && appt.notes.toLowerCase().includes(term)) ||
        appt.appointment_type.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date));

  // 🔹 Paginación visual (scroll controlado)
  const totalItems = filteredAppointments.length;
  const paginatedAppointments = filteredAppointments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Citas</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {moment().format("dddd, DD [de] MMMM YYYY - HH:mm")}
        </p>
      </div>

      {/* Formulario de creación */}
      {showCreateForm && (
        <AppointmentForm
          onSubmit={(data) => saveAppointment(data)}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* Modal de detalle */}
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

      {/* Formulario de edición */}
      {editingAppointment && (
        <AppointmentEditForm
          appointment={editingAppointment}
          onSubmit={(id, data) => saveAppointment(data, id)}
          onClose={() => setEditingAppointment(null)}
        />
      )}

      {/* Vista combinada */}
      <div className="flex flex-col gap-6 mt-6">
        {/* Calendario */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Calendario</h2>
          <CalendarGrid
            appointments={allAppointments} // 🔹 universo completo
            onSelectDate={(date) => setSelectedDate(date)}
            onSelectAppointment={(appt) => setViewingAppointment(appt)}
          />
        </div>

        {/* Lista ejecutiva */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {selectedDate
                ? `Citas del ${moment(selectedDate).format("DD/MM/YYYY")}`
                : "Todas las Citas"}
            </h2>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                           bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                           hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
              >
                Ver todas
              </button>
            )}
          </div>

          {/* Filtros + Nueva Cita */}
          <div className="flex flex-wrap gap-2 mb-4">
            <AppointmentFilters
              activeFilter={statusFilter}
              onFilterChange={setStatusFilter}
            />
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition text-sm"
            >
              + Nueva Cita
            </button>
          </div>

          {/* Buscador */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Buscar por paciente, fecha, tipo o nota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                         bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                         focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <AppointmentsList
            appointments={paginatedAppointments} // 🔹 slice visual
            onEdit={(a) => setViewingAppointment(a)}
            onDelete={(id) => deleteAppointmentSafe(id)}
            onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          />

          {/* Paginación */}
          {totalItems > 0 && (
            <div className="flex justify-end mt-4">
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
  );
}
