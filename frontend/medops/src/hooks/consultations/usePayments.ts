// src/hooks/consultations/usePayments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export interface Payment {
  id: number;
  amount: number;
  method: string;
  status: string;
  reference_number?: string | null;
  bank_name?: string | null;
  received_by?: string | null;
  received_at?: string | null;
}

interface CreatePaymentInput {
  appointment: number;
  amount: number;
  method: string;
  reference_number?: string | null;
  bank_name?: string | null;
}

export function usePayments(appointmentId: number) {
  return useQuery<Payment[]>({
    queryKey: ["payments", appointmentId],
    queryFn: async () => {
      const res = await apiFetch(`payments/?appointment=${appointmentId}`);
      return res as Payment[];
    },
  });
}

export function useCreatePayment(appointmentId: number) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreatePaymentInput) => {
      return apiFetch("payments/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending, // ✅ v5
  };
}
