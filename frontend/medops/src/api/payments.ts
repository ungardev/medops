// src/api/payments.ts
import { apiFetch } from "./client";
import { 
  Payment, 
  PaymentInput,
  PendingPayment,
  VerifyPaymentInput,
  VerifyPaymentResponse
} from "../types/payments";

// =====================================================
// 🔹 ENDPOINTS DE PAGOS
// =====================================================
export const getPayments = () => apiFetch<Payment[]>("payments/");

export const createPayment = (data: PaymentInput) =>
  apiFetch<Payment>("payments/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updatePayment = (id: number, data: Partial<PaymentInput>) =>
  apiFetch<Payment>(`payments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deletePayment = (id: number) =>
  apiFetch<void>(`payments/${id}/`, {
    method: "DELETE",
  });

export const getPaymentsByPatient = (patientId: number) =>
  apiFetch<Payment[]>(`patients/${patientId}/payments/`);

export const getPaymentSummary = () =>
  apiFetch<{ method: string; total: number }[]>("payments/summary/");

export const registerPayment = (chargeOrderId: number, data: PaymentInput) =>
  apiFetch<Payment>(`charge-orders/${chargeOrderId}/payments/`, {
    method: "POST",
    body: JSON.stringify(data),
  });

// =====================================================
// 🔹 VERIFICACIÓN DE PAGOS
// =====================================================
export const getPendingPayments = () => 
  apiFetch<{ count: number; payments: PendingPayment[] }>("payments/pending/")
    .then(response => response.payments);

export const verifyPayment = (paymentId: number, data: VerifyPaymentInput) =>
  apiFetch<VerifyPaymentResponse>(`payments/${paymentId}/verify/`, {
    method: "POST",
    body: JSON.stringify(data),
  });

// =====================================================
// 🔹 REEXPORTACIONES DE TIPOS
// =====================================================
export type { Payment, PaymentInput, PendingPayment, VerifyPaymentInput, VerifyPaymentResponse };

export {
  PaymentMethod,
  PaymentStatus,
  ChargeOrderStatus,
} from "../types/payments";