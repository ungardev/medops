// src/hooks/payments/useAllChargeOrders.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { ChargeOrder } from "../../types/payments";

export function useAllChargeOrders() {
  return useQuery<ChargeOrder[], Error>({
    queryKey: ["charge-orders-all"],
    queryFn: async (): Promise<ChargeOrder[]> => {
      const res = await axios.get<{ results: ChargeOrder[] }>("/charge-orders/", {
        params: {
          page_size: 10000, // ⚔️ máximo permitido por backend
          ordering: "-appointment_date,-issued_at,-id",
        },
      });
      return res.data.results;
    },
  });
}
