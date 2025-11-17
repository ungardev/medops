// src/hooks/consultations/useChargeOrder.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetchOptional, apiFetch } from "../../api/client";
import { ChargeOrder, Payment } from "../../types/payments"; // ✅ usamos los tipos oficiales

// -----------------------------
// Tipos locales
// -----------------------------
export interface PaymentPayload {
  charge_order: number;
  amount: number;
  method: "cash" | "card" | "transfer" | "other";
  reference_number?: string | null;
  bank?: string | null;
  detail?: string | null;
}

// -----------------------------
// API helpers
// -----------------------------
async function fetchChargeOrder(appointmentId: number): Promise<ChargeOrder | null> {
  if (!appointmentId || isNaN(appointmentId)) return null;
  // 👇 apiFetchOptional convierte 404 → null
  return apiFetchOptional<ChargeOrder>(`appointments/${appointmentId}/charge-order/`);
}

async function createPayment(orderId: number, payload: PaymentPayload): Promise<Payment> {
  if (!orderId || isNaN(orderId)) throw new Error("OrderId inválido");
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
  return useQuery<ChargeOrder | null, Error>({
    queryKey: ["chargeOrder", appointmentId],
    queryFn: () => fetchChargeOrder(appointmentId),
    enabled: !!appointmentId && !isNaN(appointmentId), // ✅ blindaje contra NaN
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
        // ✅ invalidación defensiva
        queryClient.invalidateQueries({ queryKey: ["chargeOrder", appointmentId] });
      }
    },
  });
}
