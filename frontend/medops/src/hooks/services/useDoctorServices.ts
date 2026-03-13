import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { DoctorService, DoctorServiceInput } from "@/types/services";
// Definir interfaz para respuesta paginada
interface PaginatedDoctorServices {
  count: number;
  next: string | null;
  previous: string | null;
  results: DoctorService[];
}
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
      
      // ✅ CORREGIDO: Extraer results de la respuesta paginada
      const response = await apiFetch<PaginatedDoctorServices>(url);
      return response.results;
    },
  });
}
// Hook para buscar servicios (autocompletado)
export function useDoctorServicesSearch(query: string) {
  return useQuery<DoctorService[]>({
    queryKey: ["doctor-services-search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      // ✅ CORREGIDO: Extraer results de la respuesta paginada
      const response = await apiFetch<PaginatedDoctorServices>(`doctor-services/?search=${encodeURIComponent(query)}`);
      return response.results;
    },
    enabled: query.length >= 2,
  });
}
// Hook para obtener un servicio por ID
export function useDoctorService(id: number | null) {
  return useQuery<DoctorService>({
    queryKey: ["doctor-services", id],
    queryFn: async () => {
      // ✅ CORRECTO: Endpoint de detalle devuelve el objeto directamente
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
      // ✅ CORRECTO: POST devuelve el objeto creado directamente
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
      // ✅ CORRECTO: PUT devuelve el objeto actualizado directamente
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