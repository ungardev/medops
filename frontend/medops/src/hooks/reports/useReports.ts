// src/hooks/reports/useReports.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ReportFiltersInput, ReportRow } from "@/types/reports";

async function fetchReports(filters: ReportFiltersInput): Promise<ReportRow[]> {
  const { start_date, end_date, type } = filters;

  // 🔹 Usamos "/reports/" porque axios ya tiene baseURL con "/api"
  const response = await axios.get<ReportRow[]>("/reports/", {
    params: {
      type: type ?? "financial",
      start_date: start_date || undefined,
      end_date: end_date || undefined,
    },
  });

  return response.data;
}

export function useReports(filters: ReportFiltersInput | null) {
  return useQuery<ReportRow[], Error>({
    queryKey: ["reports", filters],
    queryFn: () => {
      if (!filters) {
        return Promise.resolve([]); // ✅ evita error si no hay filtros
      }
      return fetchReports(filters);
    },
    enabled: !!filters, // ✅ solo consulta si hay filtros aplicados
    placeholderData: (prev) => prev, // ✅ mantiene datos previos mientras carga nuevos
    refetchOnWindowFocus: false, // ✅ evita recargas innecesarias al cambiar de pestaña
  });
}
