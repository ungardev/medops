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

// Fetch con parámetros de paginación
async function fetchPatients(page: number, pageSize: number): Promise<PaginatedPatients> {
  return apiFetch<PaginatedPatients>(`patients/?page=${page}&page_size=${pageSize}`);
}

// Hook institucionalizado
export function usePatients(page: number, pageSize: number = 10) {
  return useQuery<PaginatedPatients, Error>({
    queryKey: ["patients", { page, pageSize }],
    queryFn: () => fetchPatients(page, pageSize),
    staleTime: 60_000,       // 1 minuto de frescura
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData, // mantiene datos previos mientras carga la nueva página
  });
}
