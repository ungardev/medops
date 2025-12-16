import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { ChargeOrder } from "@/types/payments";

export function useChargeOrdersSearch(query: string) {
  return useQuery<ChargeOrder[]>({
    queryKey: ["charge-orders-search", query],
    queryFn: async () => {
      const q = query.trim();
      if (!q) return [];

      const url = `/charge-orders/search/?q=${encodeURIComponent(q)}`;

      const res = await apiFetch(url, {
        method: "GET",
      });

      return res as ChargeOrder[];
    },
    enabled: query.trim().length > 0,
    staleTime: 1000 * 60,
  });
}
