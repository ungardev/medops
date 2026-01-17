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
      
      // 🔹 Normalización de Logo
      if (data.logo && typeof data.logo === 'string' && !data.logo.startsWith('http')) {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const cleanPath = data.logo.startsWith('/') ? data.logo : `/${data.logo}`;
        data.logo = `${API_BASE}${cleanPath}`;
      }
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation({
    mutationFn: async (payload: Partial<InstitutionSettings>) => {
      // Si hay un archivo de logo, hay que usar FormData, si no, JSON es más limpio
      if (payload.logo instanceof File) {
         const formData = new FormData();
         Object.keys(payload).forEach(key => {
             const val = payload[key as keyof InstitutionSettings];
             if (val !== undefined && val !== null) formData.append(key, val as any);
         });
         const res = await api.patch<InstitutionSettings>("config/institution/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
         });
         return res.data;
      }
      
      // Actualización estándar (JSON) para cambios rápidos fintech/dirección
      const res = await api.patch<InstitutionSettings>("config/institution/", payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["config", "institution"], data);
      queryClient.invalidateQueries({ queryKey: ["config", "institution"] });
    },
  });

  return {
    ...query,
    updateInstitution: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
