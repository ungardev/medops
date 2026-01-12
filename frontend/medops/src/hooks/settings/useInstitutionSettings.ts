// src/hooks/settings/useInstitutionSettings.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { InstitutionSettings } from "@/types/config";

export function useInstitutionSettings() {
  const queryClient = useQueryClient();

  const query = useQuery<InstitutionSettings>({
    queryKey: ["config", "institution"],
    queryFn: async () => {
      const res = await api.get<InstitutionSettings>("config/institution/");
      return res.data;
    },
    // 🔹 PROTECCIÓN CONTRA BUCLES Y SOBRECARGA:
    staleTime: 1000 * 60 * 5,      // Los datos se consideran "frescos" por 5 minutos.
    gcTime: 1000 * 60 * 30,         // Mantener en caché 30 min.
    refetchOnWindowFocus: false,    // No re-validar al cambiar de pestaña (evita parpadeos al volver de F12).
    refetchOnMount: false,          // No re-validar al montar si ya hay datos en caché.
    retry: 1,                       // Si falla, solo reintenta una vez (evita bucles de error infinitos).
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      // Si el payload es FormData, Axios enviará multipart/form-data automáticamente.
      // Si es un objeto literal {}, Axios enviará application/json.
      const res = await api.patch<InstitutionSettings>("config/institution/", payload);
      return res.data;
    },
    onSuccess: (data) => {
      // 🔹 Actualización optimista y sincronización
      queryClient.setQueryData(["config", "institution"], data);
      
      // Invalidamos para asegurar que cualquier otro componente use la versión del servidor
      queryClient.invalidateQueries({ queryKey: ["config", "institution"] });
    },
    onError: (error) => {
      console.error("CRITICAL_UPDATE_ERROR:", error);
    }
  });

  return {
    ...query,
    updateInstitution: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    // Helper para previsualización local
    generatePreviewUrl: (file: File) => {
        if (!file) return "";
        return URL.createObjectURL(file);
    },
  };
}
