// src/hooks/reports/useReports.ts
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ReportFiltersInput, ReportRow } from "@/types/reports";

async function fetchReports(filters: ReportFiltersInput): Promise<ReportRow[]> {
  const { dateFrom, dateTo, type } = filters;

  const response = await axios.get("/reports", {
    params: {
      date_from: dateFrom,
      date_to: dateTo,
      type,
    },
  });

  return response.data as ReportRow[];
}

export function useReports(filters: ReportFiltersInput | null) {
  return useQuery({
    queryKey: ["reports", filters],
    queryFn: () => fetchReports(filters!),
    enabled: !!filters, // solo consulta si hay filtros aplicados
  });
}
