import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { DoctorService, DoctorServiceInput } from "@/types/services";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
// Definir interfaz para respuesta paginada
interface PaginatedDoctorServices {
  count: number;
  next: string | null;
  previous: string | null;
  results: DoctorService[];
}
// Hook para obtener servicios (con filtros opcionales)
export function useDoctorServices(categoryId?: number | null, searchQuery?: string) {
  const { data: doctorConfig } = useDoctorConfig(); // Obtener config del doctor
  
  return useQuery<DoctorService[]>({
    queryKey: ["doctor-services", categoryId, searchQuery, doctorConfig?.active_institution?.id],
    queryFn: async () => {
      let url = "doctor-services/";
      const params = new URLSearchParams();
      if (categoryId) params.append("category", categoryId.toString());
      if (searchQuery && searchQuery.length >= 2) params.append("search", searchQuery);
      if (params.toString()) url += `?${params.toString()}`;
      // Headers con X-Institution-ID
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // ✅ CORREGIDO: Usar doctorConfig.active_institution.id (objeto con id)
      if (doctorConfig?.active_institution?.id) {
        headers["X-Institution-ID"] = doctorConfig.active_institution.id.toString();
      }
      const response = await apiFetch<PaginatedDoctorServices>(url, { headers });
      return response.results;
    },
    enabled: !!doctorConfig, // Solo ejecutar si tenemos la config del doctor
  });
}
// Hook para buscar servicios (autocompletado)
export function useDoctorServicesSearch(query: string) {
  const { data: doctorConfig } = useDoctorConfig();
  
  return useQuery<DoctorService[]>({
    queryKey: ["doctor-services-search", query, doctorConfig?.active_institution?.id],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // ✅ CORREGIDO: Usar doctorConfig.active_institution.id (objeto con id)
      if (doctorConfig?.active_institution?.id) {
        headers["X-Institution-ID"] = doctorConfig.active_institution.id.toString();
      }
      const response = await apiFetch<PaginatedDoctorServices>(
        `doctor-services/?search=${encodeURIComponent(query)}`,
        { headers }
      );
      return response.results;
    },
    enabled: query.length >= 2 && !!doctorConfig,
  });
}
// Hook para obtener un servicio por ID
export function useDoctorService(id: number | null) {
  return useQuery<DoctorService>({
    queryKey: ["doctor-services", id],
    queryFn: async () => {
      return apiFetch<DoctorService>(`doctor-services/${id}/`);
    },
    enabled: !!id,
  });
}
// Hook para crear servicio
export function useCreateDoctorService() {
  const queryClient = useQueryClient();
  return useMutation<DoctorService, Error, DoctorServiceInput>({
    mutationFn: async (data) => {
      return apiFetch<DoctorService>("doctor-services/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-services"] });
    },
  });
}
// Hook para actualizar servicio
export function useUpdateDoctorService() {
  const queryClient = useQueryClient();
  return useMutation<DoctorService, Error, { id: number; data: DoctorServiceInput }>({
    mutationFn: async ({ id, data }) => {
      return apiFetch<DoctorService>(`doctor-services/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-services"] });
    },
  });
}
// Hook para eliminar servicio
export function useDeleteDoctorService() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiFetch<void>(`doctor-services/${id}/`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-services"] });
    },
  });
}