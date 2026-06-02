// src/hooks/diagnosis/useIcdSearch.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { useDebounce } from "../../hooks/useDebounce";

// ✅ Interfaz exportada para tipar resultados ICD-11
export interface IcdResult {
  id: number;
  icd_code: string;
  title: string;
  foundation_id?: string;
  definition?: string;
  synonyms?: string[];
  parent_code?: string;
}

export function useIcdSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300);
  
  return useQuery<IcdResult[]>({
    queryKey: ["icd-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      return apiFetch<IcdResult[]>(`icd/search/?q=${encodeURIComponent(debouncedQuery)}`);
    },
    enabled: !!debouncedQuery && debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}