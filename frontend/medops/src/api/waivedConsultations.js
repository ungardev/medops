import { apiFetch } from "./client";
export const getWaivedConsultations = () => apiFetch("waived-consultations/");
export const createWaivedConsultation = (data) => apiFetch("waived-consultations/", {
    method: "POST",
    body: JSON.stringify(data),
});
export const updateWaivedConsultation = (id, data) => apiFetch(`waived-consultations/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
});
export const deleteWaivedConsultation = (id) => apiFetch(`waived-consultations/${id}/`, {
    method: "DELETE",
});
