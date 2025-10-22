import { apiFetch } from "./client";
export const getPayments = () => apiFetch("payments/");
export const createPayment = (data) => apiFetch("payments/", {
    method: "POST",
    body: JSON.stringify(data),
});
export const updatePayment = (id, data) => apiFetch(`payments/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
});
export const deletePayment = (id) => apiFetch(`payments/${id}/`, {
    method: "DELETE",
});
