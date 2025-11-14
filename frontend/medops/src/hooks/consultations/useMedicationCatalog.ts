import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export interface MedicationCatalogItem {
  id: number;
  name: string;
  presentation: string;
  concentration: string;
  route: string;
  unit: string;
}

export function useMedicationCatalog(searchTerm: string) {
  return useQuery<MedicationCatalogItem[]>({
    queryKey: ["medicationCatalog", searchTerm],
    queryFn: async () => {
      const response = await axios.get("/api/medications/", {
        params: { search: searchTerm },
      });
      return response.data as MedicationCatalogItem[];
    },
    enabled: !!searchTerm,
    staleTime: 5 * 60 * 1000, // cache por 5 minutos
  });
}
