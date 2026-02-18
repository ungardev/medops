// src/hooks/consultations/usePayments.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
interface PaymentInput {
  appointmentId: number;
  amount: number;
  method: string;
  reference?: string;
}
export function usePayments() {
  const queryClient = useQueryClient();
  const createPayment = useMutation({
    mutationFn: async (data: PaymentInput) => {
      return apiFetch("payments/", {
        method: "POST",
        body: JSON.stringify({
          appointment: data.appointmentId,
          amount: data.amount,
          method: data.method,
          reference: data.reference,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
  return { createPayment };
}