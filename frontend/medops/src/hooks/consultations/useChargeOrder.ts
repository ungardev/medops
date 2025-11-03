import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// -----------------------------
// Tipos
// -----------------------------
export interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
  reference_number?: string | null;
  bank?: string | null;     // 👈 agregado
  detail?: string | null;   // 👈 agregado
}

export interface PaymentPayload {
  charge_order: number;
  amount: number;
  method: "cash" | "card" | "transfer" | "other"; // 👈 más estricto
  reference_number?: string | null;
  bank?: string | null;     // 👈 agregado
  detail?: string | null;   // 👈 agregado
}

export interface ChargeItem {
  id: number;
  code: string;
  description: string;
  qty: number;
  unit_price: number;
  subtotal: number;
}

export interface ChargeOrder {
  id: number;
  appointment: number;
  patient: number;
  currency: string;
  status: "open" | "partially_paid" | "paid" | "void";
  total: number;
  balance_due: number;
  items: ChargeItem[];
  payments: Payment[];
}

// -----------------------------
// API helpers
// -----------------------------
async function fetchChargeOrder(appointmentId: number): Promise<ChargeOrder | null> {
  try {
    // 👇 quitamos el /api, axios ya lo añade desde baseURL
    const res = await axios.get(`/appointments/${appointmentId}/charge-order/`);
    return res.data as ChargeOrder;
  } catch (err: any) {
    if (err.response && err.response.status === 404) {
      return null;
    }
    throw err;
  }
}

async function createPayment(orderId: number, payload: PaymentPayload): Promise<Payment> {
  // 👇 igual aquí, sin /api
  const res = await axios.post(`/charge-orders/${orderId}/payments/`, payload);
  return res.data as Payment;
}

// -----------------------------
// Hooks
// -----------------------------
export function useChargeOrder(appointmentId: number) {
  return useQuery<ChargeOrder | null>({
    queryKey: ["chargeOrder", appointmentId],
    queryFn: () => fetchChargeOrder(appointmentId),
    staleTime: 30_000, // 30s
  });
}

export function useCreatePayment(orderId?: number, appointmentId?: number) {
  const queryClient = useQueryClient();

  return useMutation<Payment, Error, PaymentPayload>({
    mutationFn: (payload) => {
      if (!orderId) throw new Error("OrderId requerido para crear pago");
      return createPayment(orderId, payload);
    },
    onSuccess: () => {
      if (appointmentId != null) {
        queryClient.invalidateQueries({ queryKey: ["chargeOrder", appointmentId] });
      }
    },
  });
}
