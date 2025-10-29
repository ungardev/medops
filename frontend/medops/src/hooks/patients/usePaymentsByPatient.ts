// src/hooks/usePaymentsByPatient.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { Payment } from "../../types/payments";

interface PaymentsResult {
  list: Payment[];
  totalCount: number;
  totalAmount: number;
}

async function fetchPaymentsByPatient(patientId: number): Promise<Payment[]> {
  return apiFetch<Payment[]>(`patients/${patientId}/payments/`);
}

export function usePaymentsByPatient(patientId: number) {
  return useQuery<Payment[], Error, PaymentsResult>({
    queryKey: ["payments", patientId],
    queryFn: () => fetchPaymentsByPatient(patientId),
    enabled: !!patientId,
    select: (data) => ({
      list: data,
      totalCount: data.length,
      totalAmount: data.reduce(
        (sum, p) => sum + (p.amount ? parseFloat(p.amount as unknown as string) : 0),
        0
      ),
    }),
  });
}
