// src/hooks/usePatients.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { Patient } from "types/patients";

export interface PaginatedPatients {
  results: Patient[];
  total: number;
  page: number;
  pageSize: number;
}

// Detecta y mapea múltiples formatos posibles del backend
async function fetchPatients(page: number, pageSize: number): Promise<PaginatedPatients> {
  const url = `patients/?page=${page}&page_size=${pageSize}`;
  const response = await apiFetch<any>(url);

  // Forma DRF clásica: { count, results, next, previous }
  if (response && Array.isArray(response.results) && typeof response.count === "number") {
    return {
      results: response.results as Patient[],
      total: response.count as number,
      page,
      pageSize,
    };
  }

  // Forma institucional previa: { results, total, page, pageSize }
  if (
    response &&
    Array.isArray(response.results) &&
    typeof response.total === "number"
  ) {
    // Si el backend ya devuelve page/pageSize, respetarlos; si no, usar los argumentos
    const respPage = typeof response.page === "number" ? response.page : page;
    const respPageSize = typeof response.pageSize === "number" ? response.pageSize : pageSize;
    return {
      results: response.results as Patient[],
      total: response.total as number,
      page: respPage,
      pageSize: respPageSize,
    };
  }

  // Forma plana (sin paginación): []
  if (Array.isArray(response)) {
    const arr = response as Patient[];
    return {
      results: arr,
      total: arr.length,
      page,
      pageSize,
    };
  }

  // Forma alternativa: { items: [], total: N }
  if (response && Array.isArray(response.items) && typeof response.total === "number") {
    return {
      results: response.items as Patient[],
      total: response.total as number,
      page,
      pageSize,
    };
  }

  // Blindaje final: nunca reventar la UI
  console.warn("[usePatients] Respuesta no mapeable. Devolviendo vacío.", response);
  return {
    results: [],
    total: 0,
    page,
    pageSize,
  };
}

export function usePatients(page: number, pageSize: number = 10) {
  return useQuery<PaginatedPatients, Error>({
    queryKey: ["patients", page, pageSize], // clave estable y simple
    queryFn: () => fetchPatients(page, pageSize),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}
