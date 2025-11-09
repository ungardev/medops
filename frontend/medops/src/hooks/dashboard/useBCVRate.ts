import { useQuery } from "@tanstack/react-query";
import { DashboardAPI } from "@/api/dashboard";

type BCVRate = {
  value: number;
  unit: string;
  precision: number;
  is_fallback: boolean;
};

export function useBCVRate() {
  return useQuery<BCVRate>({
    queryKey: ["bcv-rate"],
    queryFn: async () => {
      const summary = await DashboardAPI.summary({ range: "day", currency: "USD" });
      return summary.bcv_rate!;
    },
    staleTime: 60_000, // cache institucional de 1 minuto
  });
}
