// src/hooks/payments/useChargeOrdersPaginated.ts
import { useQuery } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { ChargeOrder } from "../../types/payments";

export interface PaginatedChargeOrderResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChargeOrder[];
}

export function useChargeOrdersPaginated(page: number = 1, pageSize: number = 10) {
  return useQuery<PaginatedChargeOrderResponse, Error>({
    queryKey: ["charge-orders", page, pageSize],
    queryFn: async (): Promise<PaginatedChargeOrderResponse> =>
      apiFetch<PaginatedChargeOrderResponse>(
        `/charge-orders/?page=${page}&page_size=${pageSize}&ordering=-appointment_date,-issued_at,-id`,
        { method: "GET" }
      ),
    staleTime: 60_000,
    gcTime: Infinity,
    placeholderData: keepPreviousData,
  });
}