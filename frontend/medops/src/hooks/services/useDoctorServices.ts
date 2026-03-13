import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { DoctorService, DoctorServiceInput } from "@/types/services";
// Hook para obtener servicios (con filtros opcionales)
export function useDoctorServices(categoryId?: number | null, searchQuery?: string) {
  return useQuery<DoctorService[]>({
    queryKey: ["doctor-services", categoryId, searchQuery],
    queryFn: async () => {
      let url = "doctor-services/";
      const params = new URLSearchParams();
      
      if (categoryId) params.append("category", categoryId.toString());
      if (searchQuery && searchQuery.length >= 2) params.append("search", searchQuery);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      return apiFetch<DoctorService[]>(url); // ✅ CORRECTO: apiFetch ya devuelve el dato parseado
    },
  });
}
// Hook para buscar servicios (autocompletado)
export function useDoctorServicesSearch(query: string) {
  return useQuery<DoctorService[]>({
    queryKey: ["doctor-services-search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      return apiFetch<DoctorService[]>(`doctor-services/?search=${encodeURIComponent(query)}`); // ✅ CORRECTO
    },
    enabled: query.length >= 2,
  });
}
// Hook para obtener un servicio por ID
export function useDoctorService(id: number | null) {
  return useQuery<DoctorService>({
    queryKey: ["doctor-services", id],
    queryFn: async () => {
      return apiFetch<DoctorService>(`doctor-services/${id}/`); // ✅ CORRECTO
    },
    enabled: !!id,
  });
}
// Hook para crear servicio
export function useCreateDoctorService() {
  const queryClient = useQueryClient();
  
  return useMutation<DoctorService, Error, DoctorServiceInput>({
    mutationFn: async (data) => {
      return apiFetch<DoctorService>("doctor-services/", { // ✅ CORRECTO
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
      return apiFetch<DoctorService>(`doctor-services/${id}/`, { // ✅ CORRECTO
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
      await apiFetch<void>(`doctor-services/${id}/`, { // ✅ CORRECTO
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-services"] });
    },
  });
}