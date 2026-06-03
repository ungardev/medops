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
    mutationFn: async (payload: Partial<InstitutionSettings> & { neighborhood?: number; institutionId?: number }) => {
      // Si hay un archivo de logo, hay que usar FormData
      if (payload.logo instanceof File) {
         const formData = new FormData();
         const institutionId = payload.institutionId;
         
         // ✅ FIX: Manejar cada campo correctamente según su tipo
         Object.keys(payload).forEach(key => {
             const val = payload[key as keyof typeof payload];
             
             if (val === undefined || val === null) return;
             if (key === 'institutionId') return; // No enviar al backend
             
             // ✅ Los números deben convertirse a string para FormData
             if (key === 'neighborhood' && typeof val === 'number') {
                 formData.append(key, String(val));
             } 
             // ✅ El archivo va directo
             else if (val instanceof File) {
                 formData.append(key, val);
             }
             // ✅ Los demás campos como strings
             else {
                 formData.append(key, String(val));
             }
         });
         
         const headers: Record<string, string> = { "Content-Type": "multipart/form-data" };
         if (institutionId) {
             headers["X-Institution-ID"] = String(institutionId);
         }
         
         const res = await api.patch<InstitutionSettings>("config/institution/", formData, { headers });
         return res.data;
      }
      
      // ✅ Actualización estándar (JSON) - el neighborhood ya es número aquí
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