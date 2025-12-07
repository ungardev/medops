import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";  // ⚔️ Cliente institucional
import { InstitutionSettings } from "@/types/config";

export function useInstitutionSettings() {
  const queryClient = useQueryClient();

  // 🔹 GET configuración institucional
  const query = useQuery<InstitutionSettings>({
    queryKey: ["config", "institution"],
    queryFn: async () => {
      const res = await api.get<InstitutionSettings>("config/institution/");
      return res.data;
    },
  });

  // 🔹 PATCH actualización institucional (multipart/form-data)
  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<InstitutionSettings>) => {
      const formData = new FormData();
      if (newSettings.name) formData.append("name", newSettings.name);
      if (newSettings.address) formData.append("address", newSettings.address);
      if (newSettings.phone) formData.append("phone", newSettings.phone);
      if (newSettings.tax_id) formData.append("tax_id", newSettings.tax_id);
      if (newSettings.logo && newSettings.logo instanceof File) {
        formData.append("logo", newSettings.logo);
      }

      const res = await api.patch("config/institution/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["config", "institution"], data);
    },
  });

  // 🔹 Manejo de logo preview
  const handleLogoChange = (file: File) => URL.createObjectURL(file);

  return {
    ...query,
    updateInstitution: mutation.mutateAsync,
    handleLogoChange,
  };
}
