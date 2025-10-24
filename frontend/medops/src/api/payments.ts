import { apiFetch } from "./client";
import { Payment, PaymentInput } from "../types/payments";

export const getPayments = () => apiFetch<Payment[]>("payments/");

export const createPayment = (data: PaymentInput) =>
  apiFetch("payments/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updatePayment = (id: number, data: PaymentInput) =>
  apiFetch(`payments/${id}/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deletePayment = (id: number) =>
  apiFetch(`payments/${id}/`, {
    method: "DELETE",
  });

// 🔹 Obtener todos los pagos de un paciente específico
export const getPaymentsByPatient = (patientId: number) =>
  apiFetch<Payment[]>(`patients/${patientId}/payments/`);

// 🔹 Reexportar tipo
export type { Payment };
