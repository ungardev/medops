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
