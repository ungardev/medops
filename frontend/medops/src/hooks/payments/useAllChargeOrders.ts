// src/hooks/payments/useAllChargeOrders.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client"; // 🆕 CAMBIO CRÍTICO
import type { ChargeOrder } from "../../types/payments";
export function useAllChargeOrders() {
  return useQuery<ChargeOrder[], Error>({
    queryKey: ["charge-orders-all"],
    queryFn: async (): Promise<ChargeOrder[]> => {
      // 🆕 USAR CLIENTE INSTITUCIONAL CON AUTENTICACIÓN Y HEADERS
      const res = await apiFetch<{ results: ChargeOrder[] }>(
        `charge-orders/?page_size=10000&ordering=-appointment_date,-issued_at,-id`
      );
      return res.results;
    },
  });
}