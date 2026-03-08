// src/hooks/payments/useVerifyPayment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { verifyPayment } from "../../api/payments";
import type { VerifyPaymentInput } from "../../types/payments";
export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: number; data: VerifyPaymentInput }) =>
      verifyPayment(paymentId, data),
    onSuccess: () => {
      // Invalidar caché de pagos pendientes
      queryClient.invalidateQueries({ queryKey: ["payments", "pending"] });
      // Invalidar caché general de pagos
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}