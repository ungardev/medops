import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetchOptional, apiFetch } from "../../api/client"; // 👈 apiFetchOptional para GET, apiFetch para POST

// -----------------------------
// Tipos
// -----------------------------
export interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
  reference_number?: string | null;
  bank?: string | null;
  detail?: string | null;
}

export interface PaymentPayload {
  charge_order: number;
  amount: number;
  method: "cash" | "card" | "transfer" | "other";
  reference_number?: string | null;
  bank?: string | null;
  detail?: string | null;
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
  status: "open" | "partially_paid" | "paid" | "void" | "waived"; // 👈 añadido "waived"
  total: number;
  balance_due: number;
  items: ChargeItem[];
  payments: Payment[];
}

// -----------------------------
// API helpers
// -----------------------------
async function fetchChargeOrder(appointmentId: number): Promise<ChargeOrder | null> {
  // 👇 apiFetchOptional convierte 404 → null
  return apiFetchOptional<ChargeOrder>(`appointments/${appointmentId}/charge-order/`);
}

async function createPayment(orderId: number, payload: PaymentPayload): Promise<Payment> {
  // 👇 apiFetch asegura que siempre devuelva un Payment válido
  return apiFetch<Payment>(`charge-orders/${orderId}/payments/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// -----------------------------
// Hooks
// -----------------------------
export function useChargeOrder(appointmentId: number) {
  return useQuery<ChargeOrder | null>({
    queryKey: ["chargeOrder", appointmentId],
    queryFn: () => fetchChargeOrder(appointmentId),
    staleTime: 30_000,
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
