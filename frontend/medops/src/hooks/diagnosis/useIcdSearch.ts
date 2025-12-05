// src/hooks/diagnosis/useIcdSearch.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

// ✅ Interfaz exportada para tipar resultados ICD-11
export interface IcdResult {
  icd_code: string;
  title: string;
  foundation_id?: string;
  definition?: string;
  synonyms?: string[];
  parent_code?: string;
}

export function useIcdSearch(query: string) {
  return useQuery<IcdResult[]>({
    queryKey: ["icd-search", query],
    queryFn: async () => {
      if (!query || query.length < 1) return []; // 🔹 ahora dispara desde el primer caracter
      return apiFetch<IcdResult[]>(`icd/search/?q=${encodeURIComponent(query)}`);
    },
    enabled: !!query && query.length >= 1, // 🔹 habilitado desde el primer caracter
    staleTime: 1000 * 60 * 5, // cache 5 minutos
  });
}
