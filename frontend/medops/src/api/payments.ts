import { apiFetch } from "./client";
import { Payment, PaymentInput } from "../types/payments";

// 🔹 Obtener todos los pagos
export const getPayments = () => apiFetch<Payment[]>("payments/");

// 🔹 Crear un nuevo pago
export const createPayment = (data: PaymentInput) =>
  apiFetch("payments/", {
    method: "POST",
    body: JSON.stringify(data),
  });

// 🔹 Actualizar un pago (PATCH parcial)
export const updatePayment = (id: number, data: Partial<PaymentInput>) =>
  apiFetch(`payments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

// 🔹 Eliminar un pago
export const deletePayment = (id: number) =>
  apiFetch(`payments/${id}/`, {
    method: "DELETE",
  });

// 🔹 Obtener todos los pagos de un paciente específico
export const getPaymentsByPatient = (patientId: number) =>
  apiFetch<Payment[]>(`patients/${patientId}/payments/`);

// 🔹 Resumen global de pagos por método
export const getPaymentSummary = () =>
  apiFetch<{ method: string; total: number }[]>("payments/summary/");

// 🔹 Reexportar tipo
export type { Payment };
