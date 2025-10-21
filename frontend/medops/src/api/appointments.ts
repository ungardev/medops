import { apiFetch } from "./client";
import { Appointment, AppointmentInput } from "../types/appointments";

export const getAppointments = () => apiFetch<Appointment[]>("appointments/");

export const createAppointment = (data: AppointmentInput) =>
  apiFetch("appointments/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateAppointment = (id: number, data: AppointmentInput) =>
  apiFetch(`appointments/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteAppointment = (id: number) =>
  apiFetch(`appointments/${id}/`, {
    method: "DELETE",
  });

  // 🔹 Obtener detalle de una cita por ID
export const fetchAppointmentDetail = (id: number) =>
  apiFetch<Appointment>(`appointments/${id}/`);

// 🔹 Actualizar solo el estado de una cita
export const updateAppointmentStatus = (id: number, newStatus: string) =>
  apiFetch<Appointment>(`appointments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus }),
  });
