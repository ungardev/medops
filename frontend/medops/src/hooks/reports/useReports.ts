import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ReportFiltersInput, ReportRow, ReportType } from "@/types/reports";

// 🔹 Función de consulta a la API de reportes
async function fetchReports(filters: ReportFiltersInput): Promise<ReportRow[]> {
  const { start_date, end_date, type } = filters;

  const response = await axios.get<ReportRow[]>("/reports/", {
    params: {
      type: type ?? ReportType.FINANCIAL, // ✅ default institucional con enum
      start_date: start_date || undefined,
      end_date: endDateOrUndefined(end_date),
    },
  });

  return response.data;
}

// 🔹 Helper para blindar valores nulos
function endDateOrUndefined(value: string | null | undefined): string | undefined {
  return value && value.trim() !== "" ? value : undefined;
}

// 🔹 Hook institucionalizado
export function useReports(filters: ReportFiltersInput | null) {
  return useQuery<ReportRow[], Error>({
    queryKey: ["reports", filters],
    queryFn: () => {
      if (!filters) {
        // ✅ evita error si no hay filtros aplicados
        return Promise.resolve([]);
      }
      return fetchReports(filters);
    },
    enabled: !!filters, // ✅ solo consulta si hay filtros
    placeholderData: (prev) => prev, // ✅ mantiene datos previos mientras carga nuevos
    refetchOnWindowFocus: false, // ✅ evita recargas innecesarias
    meta: {
      // 🔹 Mensajes institucionales para UI
      loadingMessage: "Cargando reportes institucionales...",
      errorMessage: "Error cargando reportes institucionales",
      emptyMessage: "No hay resultados para los filtros seleccionados",
      color: "#0d2c53", // Azul zafiro institucional
    },
  });
}
