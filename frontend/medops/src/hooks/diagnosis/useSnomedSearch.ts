// src/hooks/diagnosis/useSnomedSearch.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { useDebounce } from "../../hooks/useDebounce";

export interface SnomedResult {
  concept_id: string;
  term: string;
  definition?: string;
  semantic_tag?: string;
  hierarchy?: string;
  parent_concept_id?: string;
  synonyms?: string[];
  system?: string;
}

export function useSnomedSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300);
  
  return useQuery<SnomedResult[]>({
    queryKey: ["snomed-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      return apiFetch<SnomedResult[]>(`snomed/search/?q=${encodeURIComponent(debouncedQuery)}`);
    },
    enabled: !!debouncedQuery && debouncedQuery.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}