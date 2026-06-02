// src/hooks/medications/useMedicationCatalog.ts
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { useDebounce } from "../useDebounce";
import { MedicationCatalogItem } from "../../types/medication";

export function useMedicationCatalog(searchTerm: string, enabled: boolean = true): UseQueryResult<MedicationCatalogItem[], Error> {
  const debouncedSearch = useDebounce(searchTerm, 300);
  return useQuery<MedicationCatalogItem[]>({
    queryKey: ["medicationCatalog", debouncedSearch],
    queryFn: async (): Promise<MedicationCatalogItem[]> => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        return [];
      }
      
      const params = new URLSearchParams({
        search: debouncedSearch,
        ordering: 'name'
      });
      
      const response = await apiFetch<{ results: MedicationCatalogItem[] }>(`/medications/?${params.toString()}`);
      
      return response?.results || [];
    },
    enabled: enabled && debouncedSearch.length >= 2,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useMedicationDetail(id: number | null): UseQueryResult<MedicationCatalogItem, Error> {
  return useQuery<MedicationCatalogItem>({
    queryKey: ["medication", id],
    queryFn: async (): Promise<MedicationCatalogItem> => {
      if (!id) throw new Error("ID requerido");
      const response = await apiFetch<MedicationCatalogItem>(`/medications/${id}/`);
      return response;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}