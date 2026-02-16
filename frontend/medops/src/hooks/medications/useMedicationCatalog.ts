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
      
      const response = await axios.get<MedicationCatalogItem[]>("/api/medications/", {
        params: { 
          search: debouncedSearch,
          ordering: 'name'
        },
      });
      
      return response.data || [];
    },
    enabled: enabled && debouncedSearch.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
    placeholderData: (previousData) => previousData,
  });
}
// Hook para obtener detalles completos de un medicamento por ID
export function useMedicationDetail(id: number | null): UseQueryResult<MedicationCatalogItem, Error> {
  return useQuery<MedicationCatalogItem>({
    queryKey: ["medication", id],
    queryFn: async (): Promise<MedicationCatalogItem> => {
      if (!id) throw new Error("ID requerido");
      const response = await axios.get<MedicationCatalogItem>(`/api/medications/${id}/`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}