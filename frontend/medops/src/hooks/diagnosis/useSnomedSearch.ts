// src/hooks/diagnosis/useSnomedSearch.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
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
  return useQuery<SnomedResult[]>({
    queryKey: ["snomed-search", query],
    queryFn: async () => {
      if (!query || query.length < 1) return [];
      return apiFetch<SnomedResult[]>(`snomed/search/?q=${encodeURIComponent(query)}`);
    },
    enabled: !!query && query.length >= 1,
    staleTime: 1000 * 60 * 5,
  });
}