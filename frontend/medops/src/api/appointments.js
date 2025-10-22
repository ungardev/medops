import { apiFetch } from "./client";
export const getAppointments = () => apiFetch("appointments/");
export const createAppointment = (data) => apiFetch("appointments/", {
    method: "POST",
    body: JSON.stringify(data),
});
export const updateAppointment = (id, data) => apiFetch(`appointments/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
});
export const deleteAppointment = (id) => apiFetch(`appointments/${id}/`, {
    method: "DELETE",
});
// 🔹 Obtener detalle de una cita por ID
export const fetchAppointmentDetail = (id) => apiFetch(`appointments/${id}/`);
// 🔹 Actualizar solo el estado de una cita
export const updateAppointmentStatus = (id, newStatus) => apiFetch(`appointments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus }),
});
