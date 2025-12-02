// src/hooks/payments/useChargeOrdersSummary.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface ChargeOrdersSummary {
  total: number;
  confirmed: number;
  pending: number;
  failed: number;
}

export function useChargeOrdersSummary() {
  return useQuery<ChargeOrdersSummary, Error>({
    queryKey: ["charge-orders-summary"],
    queryFn: async (): Promise<ChargeOrdersSummary> => {
      const res = await axios.get<ChargeOrdersSummary>("/charge-orders/summary/");
      return res.data;
    },
  });
}
