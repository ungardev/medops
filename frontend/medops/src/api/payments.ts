// src/api/payments.ts
import { apiFetch } from "./client";
import { 
  Payment, 
  PaymentInput,
  // 🆕 Tipos P2C
  P2CPaymentRequest, 
  P2CPaymentResponse,
  MercantilP2CTransaction,
  MercantilP2CPaymentProps,
  // 🆕 Tipos de verificación
  PendingPayment,
  VerifyPaymentInput,
  VerifyPaymentResponse
} from "../types/payments";
// =====================================================
// 🔹 ENDPOINTS EXISTENTES (SIN CAMBIOS)
// =====================================================
// 🔹 Obtener todos los pagos
export const getPayments = () => apiFetch<Payment[]>("payments/");
// 🔹 Crear un nuevo pago (standalone, no ligado a ChargeOrder)
export const createPayment = (data: PaymentInput) =>
  apiFetch<Payment>("payments/", {
    method: "POST",
    body: JSON.stringify(data),
  });
// 🔹 Actualizar un pago (PATCH parcial)
export const updatePayment = (id: number, data: Partial<PaymentInput>) =>
  apiFetch<Payment>(`payments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
// 🔹 Eliminar un pago
export const deletePayment = (id: number) =>
  apiFetch<void>(`payments/${id}/`, {
    method: "DELETE",
  });
// 🔹 Obtener todos los pagos de un paciente específico
export const getPaymentsByPatient = (patientId: number) =>
  apiFetch<Payment[]>(`patients/${patientId}/payments/`);
// 🔹 Resumen global de pagos por método
export const getPaymentSummary = () =>
  apiFetch<{ method: string; total: number }[]>("payments/summary/");
// 🔹 Registrar pago ligado a una ChargeOrder
export const registerPayment = (chargeOrderId: number, data: PaymentInput) =>
  apiFetch<Payment>(`charge-orders/${chargeOrderId}/payments/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
// =====================================================
// 🆕 ENDPOINTS P2C MERCANTIL - EXTENSIONES PARA QR PAYMENTS
// =====================================================
// 🔹 Generar QR P2C Mercantil
export const generateP2CQR = (data: P2CPaymentRequest): Promise<P2CPaymentResponse> =>
  apiFetch<P2CPaymentResponse>("payments/p2c/mercantil/generate-qr/", {
    method: "POST",
    body: JSON.stringify(data),
  });
// 🔹 Verificar estado de transacción P2C
export const checkP2CStatus = (merchantOrderId: string): Promise<P2CPaymentResponse> =>
  apiFetch<P2CPaymentResponse>(`payments/p2c/mercantil/status/${merchantOrderId}/`);
// 🔹 Cancelar transacción P2C
export const cancelP2CTransaction = (merchantOrderId: string): Promise<P2CPaymentResponse> =>
  apiFetch<P2CPaymentResponse>(`payments/p2c/mercantil/cancel/${merchantOrderId}/`, {
    method: "POST",
  });
// 🔹 Obtener transacciones P2C por institución
export const getP2CTransactions = (institutionId: number, filters?: {
  status?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}): Promise<MercantilP2CTransaction[]> => {
  const params = new URLSearchParams();
  
  if (filters?.status) params.append('status', filters.status);
  if (filters?.date_from) params.append('date_from', filters.date_from);
  if (filters?.date_to) params.append('date_to', filters.date_to);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const queryString = params.toString();
  const endpoint = `institutions/${institutionId}/p2c/transactions/${queryString ? `?${queryString}` : ''}`;
  
  return apiFetch<MercantilP2CTransaction[]>(endpoint);
};
// 🔹 Obtener transacción P2C por merchant_order_id
export const getP2CTransactionByOrderId = (merchantOrderId: string): Promise<MercantilP2CTransaction> =>
  apiFetch<MercantilP2CTransaction>(`payments/p2c/mercantil/transaction/${merchantOrderId}/`);
// 🔹 Reintentar generar QR P2C
export const retryP2CQR = (data: P2CPaymentRequest & {
  original_merchant_order_id: string;
}): Promise<P2CPaymentResponse> =>
  apiFetch<P2CPaymentResponse>("payments/p2c/mercantil/retry-qr/", {
    method: "POST",
    body: JSON.stringify(data),
  });
// =====================================================
// 🆕 ENDPOINTS DE CONFIGURACIÓN P2C
// =====================================================
// 🔹 Obtener configuración P2C por institución
export const getP2CConfig = (institutionId: number): Promise<any> =>
  apiFetch<any>(`institutions/${institutionId}/p2c/config/`);
// 🔹 Actualizar configuración P2C por institución
export const updateP2CConfig = (institutionId: number, config: {
  is_test_mode?: boolean;
  qr_expiration_minutes?: number;
  min_amount?: number;
  max_amount?: number;
  webhook_url?: string;
}): Promise<any> =>
  apiFetch<any>(`institutions/${institutionId}/p2c/config/`, {
    method: "PATCH",
    body: JSON.stringify(config),
  });
// =====================================================
// 🆕 ENDPOINTS DE MONITOREO Y ESTADÍSTICAS P2C
// =====================================================
// 🔹 Obtener estadísticas P2C por institución
export const getP2CStatistics = (institutionId: number, period?: {
  date_from?: string;
  date_to?: string;
}): Promise<{
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  total_amount: number;
  average_amount: number;
  success_rate: number;
  daily_stats: Array<{
    date: string;
    transactions: number;
    amount: number;
  }>;
}> => {
  const params = period ? new URLSearchParams({
    date_from: period.date_from || '',
    date_to: period.date_to || ''
  }).toString() : '';
  
  const endpoint = `institutions/${institutionId}/p2c/statistics/${params ? `?${params}` : ''}`;
  
  return apiFetch<any>(endpoint);
};
// 🔹 Obtener log de webhooks P2C
export const getP2CWebhookLog = (institutionId: number, filters?: {
  merchant_order_id?: string;
  status?: string;
  limit?: number;
}): Promise<Array<{
  id: number;
  merchant_order_id: string;
  received_at: string;
  processed: boolean;
  error_message?: string;
  webhook_data: any;
}>> => {
  const params = new URLSearchParams();
  
  if (filters?.merchant_order_id) params.append('merchant_order_id', filters.merchant_order_id);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const queryString = params.toString();
  const endpoint = `institutions/${institutionId}/p2c/webhooks/${queryString ? `?${queryString}` : ''}`;
  
  return apiFetch<any[]>(endpoint);
};
// =====================================================
// 🆕 ENDPOINTS DE VERIFICACIÓN DE PAGOS (PAGO MÓVIL)
// =====================================================
// 🔹 Obtener pagos pendientes del doctor (verificación manual)
export const getPendingPayments = () => 
  apiFetch<PendingPayment[]>("payments/pending/");
// 🔹 Verificar un pago (confirmar o rechazar)
export const verifyPayment = (paymentId: number, data: VerifyPaymentInput) =>
  apiFetch<VerifyPaymentResponse>(`payments/${paymentId}/verify/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
// =====================================================
// 🔹 REEXPORTACIONES DE TIPOS
// =====================================================
// Reexportar tipos existentes
export type { Payment, PaymentInput };
// 🆕 Reexportar tipos P2C para facilitar imports
export type { 
  P2CPaymentRequest, 
  P2CPaymentResponse,
  MercantilP2CTransaction,
  MercantilP2CPaymentProps,
  P2CWebSocketUpdate,
  MercantilP2CConfig,
  P2CPaymentInput,
  // 🆕 Reexportar tipos de verificación
  PendingPayment,
  VerifyPaymentInput,
  VerifyPaymentResponse
} from "../types/payments";
// 🆕 Reexportar enums extendidos
export {
  PaymentMethod,
  PaymentStatus,
  ChargeOrderStatus,
} from "../types/payments";
// 🆕 Reexportar constantes P2C
export { P2C_CONSTANTS } from "../types/payments";