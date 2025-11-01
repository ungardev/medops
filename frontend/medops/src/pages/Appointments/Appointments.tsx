import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
} from "api/appointments";
import {
  Appointment,
  AppointmentInput,
  AppointmentStatus,
} from "types/appointments";

import AppointmentsList from "components/Appointments/AppointmentsList";
import AppointmentForm from "components/Appointments/AppointmentForm";
import AppointmentEditForm from "components/Appointments/AppointmentEditForm";
import AppointmentCalendar from "components/Appointments/AppointmentCalendar";
import AppointmentFilters from "components/Appointments/AppointmentFilters";
import AppointmentDetail from "components/Appointments/AppointmentDetail";

import { useState } from "react";
import moment from "moment";

export default function Appointments() {
  const queryClient = useQueryClient();

  // Estado para modales
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Estado para filtrar por fecha seleccionada en el calendario
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Estado para filtro por estado
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");

  // Estado para buscador inteligente
  const [search, setSearch] = useState("");

  // 🔎 Cargar citas
  const {
    data: appointments,
    isLoading,
    isError,
    error,
  } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  });

  // ✍️ Crear cita
  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  // ✍️ Actualizar cita
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AppointmentInput }) =>
      updateAppointment(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  // 🗑 Eliminar cita
  const deleteMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  // 🔄 Cambiar estado de cita
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  // Guardar cita (crear o actualizar) con confirmación
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

  // Eliminar cita con confirmación
  const deleteAppointmentSafe = (id: number) => {
    if (window.confirm("¿Está seguro de eliminar esta cita?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <p>Cargando citas...</p>;
  if (isError) return <p>Error: {(error as Error).message}</p>;

  // 🔎 Filtrar citas por fecha, estado y búsqueda + ordenar descendente
  const filteredAppointments = (appointments || [])
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

  return (
    <div>
      <h1 className="text-xl font-semibold">Citas</h1>
      {/* Header con fecha y hora actual */}
      <p className="text-muted mb-4">
        {moment().format("dddd, DD [de] MMMM YYYY - HH:mm")}
      </p>

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

      {/* Vista combinada: Calendario + Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Calendario */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Calendario</h2>
          <AppointmentCalendar
            appointments={appointments || []}
            onSelect={(appt) => setViewingAppointment(appt)}
            onSelectDate={(date) => setSelectedDate(date)}
          />
        </div>

        {/* Lista ejecutiva */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">
              {selectedDate
                ? `Citas del ${moment(selectedDate).format("DD/MM/YYYY")}`
                : "Todas las Citas"}
            </h2>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="btn btn-outline"
              >
                Ver todas
              </button>
            )}
          </div>

          {/* Filtros rápidos por estado + botón Nueva Cita */}
          <div className="flex flex-wrap gap-2 mb-4">
            <AppointmentFilters
              activeFilter={statusFilter}
              onFilterChange={setStatusFilter}
            />
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              + Nueva Cita
            </button>
          </div>

          {/* Buscador inteligente */}
          <div className="mt-3 mb-3">
            <input
              type="text"
              placeholder="Buscar por paciente, fecha, tipo o nota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
          </div>

          <AppointmentsList
            appointments={filteredAppointments}
            onEdit={(a) => setViewingAppointment(a)}
            onDelete={(id) => deleteAppointmentSafe(id)}
            onStatusChange={(id, status) =>
              statusMutation.mutate({ id, status })
            }
          />
        </div>
      </div>
    </div>
  );
}
