// src/hooks/payments/useChargeOrdersPaginated.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client"; // ⚔️ Cliente institucional
import type { ChargeOrder } from "../../types/payments";

export interface PaginatedChargeOrderResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChargeOrder[];
}

/**
 * Hook para obtener órdenes de cobro paginadas y ordenadas por fecha descendente.
 */
export function useChargeOrdersPaginated(page: number = 1, pageSize: number = 10) {
  return useQuery<PaginatedChargeOrderResponse, Error>({
    queryKey: ["charge-orders", page, pageSize],
    queryFn: async (): Promise<PaginatedChargeOrderResponse> =>
      apiFetch<PaginatedChargeOrderResponse>(
        `/charge-orders/?page=${page}&page_size=${pageSize}&ordering=-appointment_date,-issued_at,-id`,
        { method: "GET" }
      ),
    // 🔹 Mantener datos previos mientras carga la nueva página
    placeholderData: (prev) => prev,
  });
}