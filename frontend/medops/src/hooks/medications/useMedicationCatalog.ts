// src/hooks/medications/useMedicationCatalog.ts
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import axios from "axios";
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
      
      // ✅ Usar ruta relativa y tipo explícito
      const response = await axios.get<MedicationCatalogItem[]>("/medications/", {
        params: { 
          search: debouncedSearch,
          ordering: 'name'
        },
      });
      
      return response.data || [];
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
      // ✅ Tipo explícito
      const response = await axios.get<MedicationCatalogItem>(`/medications/${id}/`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}