import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,   // 👈 importado
} from "api/appointments";
import { Appointment, AppointmentInput, AppointmentStatus } from "types/appointments";
import AppointmentsList from "components/AppointmentsList";
import AppointmentForm from "components/AppointmentForm";
import { useState } from "react";

export default function Appointments() {
  const queryClient = useQueryClient();
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // 🔎 Cargar citas
  const { data: appointments, isLoading, isError, error } = useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  });

  // ✍️ Crear cita
  const createMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  // ✍️ Actualizar cita
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AppointmentInput }) =>
      updateAppointment(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  // 🗑 Eliminar cita
  const deleteMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  // 🔄 Cambiar estado de cita
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const saveAppointment = (data: AppointmentInput, id?: number) => {
    if (id) {
      updateMutation.mutate({ id, data });
      setEditingAppointment(null);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <p>Cargando citas...</p>;
  if (isError) return <p>Error: {(error as Error).message}</p>;

  return (
    <div>
      <h1>Citas</h1>
      <AppointmentForm
        onSubmit={(data) => saveAppointment(data, editingAppointment?.id)}
        appointment={editingAppointment}
      />
      <AppointmentsList
        appointments={appointments || []}
        onEdit={(a) => setEditingAppointment(a)}
        onDelete={(id) => deleteMutation.mutate(id)}
        onStatusChange={(id, status) => statusMutation.mutate({ id, status })} // 👈 nuevo
      />
    </div>
  );
}
