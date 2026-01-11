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
    // Cambiamos el tipo para aceptar FormData directamente o el objeto parcial
    mutationFn: async (payload: FormData | Partial<InstitutionSettings>) => {
      let finalData: FormData;

      if (payload instanceof FormData) {
        // Si ya viene como FormData del componente, lo usamos directamente
        finalData = payload;
      } else {
        // Si viene como objeto, construimos el FormData aquí (compatibilidad)
        finalData = new FormData();
        if (payload.name) finalData.append("name", payload.name);
        if (payload.address) finalData.append("address", payload.address);
        if (payload.phone) finalData.append("phone", payload.phone);
        if (payload.tax_id) finalData.append("tax_id", payload.tax_id);

        if (payload.neighborhood) {
          const neighborhoodId = typeof payload.neighborhood === 'object' 
            ? (payload.neighborhood as any).id 
            : payload.neighborhood;
          finalData.append("neighborhood", String(neighborhoodId));
        }

        if (payload.logo && payload.logo instanceof File) {
          finalData.append("logo", payload.logo);
        }
      }

      // Nota: No es necesario poner "multipart/form-data" manualmente, 
      // Axios lo detecta y configura el boundary automáticamente.
      const res = await api.patch("config/institution/", finalData);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["config", "institution"] });
      queryClient.setQueryData(["config", "institution"], data);
    },
  });

  const handleLogoChange = (file: File) => URL.createObjectURL(file);

  return {
    ...query,
    updateInstitution: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    handleLogoChange,
  };
}
