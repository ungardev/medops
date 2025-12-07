// src/hooks/payments/useChargeOrdersSummary.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client"; // ⚔️ Cliente institucional

export interface ChargeOrdersSummary {
  total: number;
  confirmed: number;
  pending: number;
  failed: number;
}

export function useChargeOrdersSummary() {
  return useQuery<ChargeOrdersSummary, Error>({
    queryKey: ["charge-orders-summary"],
    queryFn: async (): Promise<ChargeOrdersSummary> =>
      apiFetch<ChargeOrdersSummary>("charge-orders/summary/"),
  });
}
