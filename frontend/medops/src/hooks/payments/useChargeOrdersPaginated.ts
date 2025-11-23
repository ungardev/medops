// src/hooks/payments/useChargeOrdersPaginated.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
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
    queryFn: async (): Promise<PaginatedChargeOrderResponse> => {
      const res = await axios.get<PaginatedChargeOrderResponse>("/charge-orders/", {
        params: {
          page,
          page_size: pageSize,
          // 🔹 Orden institucional: más recientes primero, con desempate por id
          ordering: "-appointment_date,-issued_at,-id",
        },
      });
      return res.data;
    },
    // 🔹 Mantener datos previos mientras carga la nueva página
    placeholderData: (prev) => prev,
  });
}
