import { apiFetch } from "./client";
// --- Citas ---
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
// 🔹 Obtener resumen del dashboard con filtros opcionales
export const getDashboardSummary = (startDate, endDate, status) => {
    const params = new URLSearchParams();
    if (startDate)
        params.append("start_date", startDate);
    if (endDate)
        params.append("end_date", endDate);
    if (status)
        params.append("status", status);
    return apiFetch(`dashboard/summary/${params.toString() ? "?" + params.toString() : ""}`);
};
