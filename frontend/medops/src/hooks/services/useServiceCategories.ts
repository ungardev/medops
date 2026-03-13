import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import type { ServiceCategory, ServiceCategoryInput } from "@/types/services";
// Hook para obtener todas las categorías
export function useServiceCategories() {
  return useQuery<ServiceCategory[]>({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const response = await apiFetch<{
        count: number;
        next: string | null;
        previous: string | null;
        results: ServiceCategory[];
      }>("service-categories/");
      return response.results;
    },
  });
}
// Hook para obtener una categoría por ID
export function useServiceCategory(id: number | null) {
  return useQuery<ServiceCategory>({
    queryKey: ["service-categories", id],
    queryFn: async () => {
      return apiFetch<ServiceCategory>(`service-categories/${id}/`); // ✅ CORRECTO
    },
    enabled: !!id,
  });
}
// Hook para crear categoría
export function useCreateServiceCategory() {
  const queryClient = useQueryClient();
  
  return useMutation<ServiceCategory, Error, ServiceCategoryInput>({
    mutationFn: async (data) => {
      return apiFetch<ServiceCategory>("service-categories/", { // ✅ CORRECTO
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
    },
  });
}
// Hook para actualizar categoría
export function useUpdateServiceCategory() {
  const queryClient = useQueryClient();
  
  return useMutation<ServiceCategory, Error, { id: number; data: ServiceCategoryInput }>({
    mutationFn: async ({ id, data }) => {
      return apiFetch<ServiceCategory>(`service-categories/${id}/`, { // ✅ CORRECTO
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
    },
  });
}
// Hook para eliminar categoría
export function useDeleteServiceCategory() {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await apiFetch<void>(`service-categories/${id}/`, { // ✅ CORRECTO
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-categories"] });
    },
  });
}