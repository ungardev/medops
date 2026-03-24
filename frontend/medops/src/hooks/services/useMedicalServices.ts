import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
export interface MedicalService {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
}
export function useMedicalServices() {
  return useQuery<MedicalService[]>({
    queryKey: ["medicalServices"],
    queryFn: async () => apiFetch("api/medical-services/"),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}