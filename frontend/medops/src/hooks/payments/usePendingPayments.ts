// src/hooks/payments/usePendingPayments.ts
import { useQuery } from "@tanstack/react-query";
import { getPendingPayments } from "../../api/payments";
import type { PendingPayment } from "../../types/payments";
export function usePendingPayments() {
  return useQuery<PendingPayment[]>({
    queryKey: ["payments", "pending"],
    queryFn: getPendingPayments,
    staleTime: 30_000,    // 30 segundos
    refetchInterval: 60_000, // Refrescar cada minuto
  });
}