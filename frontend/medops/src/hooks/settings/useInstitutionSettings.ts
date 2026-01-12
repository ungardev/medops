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
  });

  const mutation = useMutation({
    mutationFn: async (payload: FormData | Partial<InstitutionSettings>) => {
      let finalData: FormData;

      if (payload instanceof FormData) {
        finalData = payload;
      } else {
        finalData = new FormData();
        
        // Mapeo seguro: Solo agregamos si hay valor
        if (payload.name) finalData.append("name", payload.name);
        if (payload.address) finalData.append("address", payload.address);
        if (payload.phone) finalData.append("phone", payload.phone);
        if (payload.tax_id) finalData.append("tax_id", payload.tax_id);

        if (payload.neighborhood) {
          const neighborhoodId = typeof payload.neighborhood === 'object' 
            ? (payload.neighborhood as any).id 
            : payload.neighborhood;
          
          // Enviamos ambas para mayor compatibilidad con Serializers de Django
          finalData.append("neighborhood", String(neighborhoodId));
          finalData.append("neighborhood_id", String(neighborhoodId));
        }

        if (payload.logo instanceof File) {
          finalData.append("logo", payload.logo);
        }
      }

      // DEBUG: Ver qué sale exactamente hacia el servidor
      console.log("--- OUTGOING PAYLOAD DEBUG ---");
      finalData.forEach((value, key) => {
        console.log(`${key}:`, value);
      });

      // No forzamos Content-Type para que Axios/Browser manejen el boundary del FormData
      const res = await api.patch<InstitutionSettings>("config/institution/", finalData);
      return res.data;
    },
    onSuccess: (data) => {
      // Forzamos actualización inmediata del cache
      queryClient.setQueryData(["config", "institution"], data);
      queryClient.invalidateQueries({ queryKey: ["config", "institution"] });
    },
    onError: (error) => {
      console.error("INSTITUTION_UPDATE_FAILED:", error);
    }
  });

  return {
    ...query,
    updateInstitution: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    // Helper para generar URL temporal de archivos locales
    generatePreviewUrl: (file: File) => URL.createObjectURL(file),
  };
}
