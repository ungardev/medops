import { apiFetch } from "./client";
export const getPatients = () => apiFetch("patients/");
export const createPatient = (data) => apiFetch("patients/", {
    method: "POST",
    body: JSON.stringify(data),
});
export const updatePatient = (id, data) => apiFetch(`patients/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
});
export const deletePatient = (id) => apiFetch(`patients/${id}/`, {
    method: "DELETE",
});
