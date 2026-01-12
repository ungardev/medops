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
      const data = res.data;
      
      // 🔹 NORMALIZACIÓN CRÍTICA DEL LOGO:
      // Si el logo existe y no es una URL absoluta, le concatenamos la base de la API.
      if (data.logo && typeof data.logo === 'string' && !data.logo.startsWith('http')) {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        // Limpiamos posibles barras duplicadas
        const cleanPath = data.logo.startsWith('/') ? data.logo : `/${data.logo}`;
        data.logo = `${API_BASE}${cleanPath}`;
      }

      return data;
    },
    // 🔹 PROTECCIÓN CONTRA BUCLES Y SOBRECARGA:
    staleTime: 1000 * 60 * 5,      // Los datos se consideran "frescos" por 5 minutos.
    gcTime: 1000 * 60 * 30,         // Mantener en caché 30 min.
    refetchOnWindowFocus: false,    // Evita parpadeos y re-peticiones al cambiar de pestaña.
    refetchOnMount: false,          // Usa la caché si existe al montar el componente.
    retry: 1,                       // Limita reintentos en caso de error.
  });

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      // Axios detecta si es FormData o JSON automáticamente
      const res = await api.patch<InstitutionSettings>("config/institution/", payload);
      return res.data;
    },
    onSuccess: (data) => {
      // Actualizamos la caché localmente con la respuesta del servidor
      queryClient.setQueryData(["config", "institution"], data);
      
      // Invalidamos para forzar una sincronización limpia si fuera necesario
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
    // Helper para previsualización de archivos antes de subir
    generatePreviewUrl: (file: File) => {
        if (!file) return "";
        return URL.createObjectURL(file);
    },
  };
}
