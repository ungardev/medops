// src/hooks/settings/useInstitutionSettings.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { InstitutionSettings } from "@/types/config";

export function useInstitutionSettings() {
  const queryClient = useQueryClient();

  // 🔹 GET: Recibe la configuración con el objeto Neighborhood expandido
  const query = useQuery<InstitutionSettings>({
    queryKey: ["config", "institution"],
    queryFn: async () => {
      const res = await api.get<InstitutionSettings>("config/institution/");
      return res.data;
    },
  });

  // 🔹 PATCH: Actualización con FormData para soportar archivos y IDs relacionales
  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<InstitutionSettings>) => {
      const formData = new FormData();
      
      // Mapeo de campos simples
      if (newSettings.name) formData.append("name", newSettings.name);
      if (newSettings.address) formData.append("address", newSettings.address);
      if (newSettings.phone) formData.append("phone", newSettings.phone);
      if (newSettings.tax_id) formData.append("tax_id", newSettings.tax_id);

      // ⚔️ Lógica de Neighborhood: Extraer ID si es objeto, o usar el número directamente
      if (newSettings.neighborhood) {
        const neighborhoodId = typeof newSettings.neighborhood === 'object' 
          ? newSettings.neighborhood.id 
          : newSettings.neighborhood;
        formData.append("neighborhood", neighborhoodId.toString());
      }

      // Manejo del Logo
      if (newSettings.logo && newSettings.logo instanceof File) {
        formData.append("logo", newSettings.logo);
      }

      const res = await api.patch("config/institution/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data) => {
      // Invalidar para forzar el refresco de la jerarquía completa en la UI
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
