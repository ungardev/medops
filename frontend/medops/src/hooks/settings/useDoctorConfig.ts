import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";  // ⚔️ Cliente institucional
import { DoctorConfig } from "@/types/config";

export function useDoctorConfig() {
  const queryClient = useQueryClient();

  // 🔹 GET configuración del médico operador
  const query = useQuery<DoctorConfig>({
    queryKey: ["config", "doctor"],
    queryFn: async () => {
      const res = await api.get<DoctorConfig>("config/doctor/");
      return res.data;
    },
  });

  // 🔹 PATCH actualización del médico operador (multipart/form-data)
  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<DoctorConfig>) => {
      const formData = new FormData();

      if (newSettings.full_name) formData.append("full_name", newSettings.full_name);
      if (newSettings.colegiado_id) formData.append("colegiado_id", newSettings.colegiado_id);
      if (newSettings.license) formData.append("license", newSettings.license);
      if (newSettings.email) formData.append("email", newSettings.email);
      if (newSettings.phone) formData.append("phone", newSettings.phone);
      if (newSettings.signature && newSettings.signature instanceof File) {
        formData.append("signature", newSettings.signature);
      }

      // 🔹 specialty_ids como lista en multipart
      if (newSettings.specialty_ids && Array.isArray(newSettings.specialty_ids)) {
        newSettings.specialty_ids.forEach((id) => {
          formData.append("specialty_ids", String(id));
        });
      }

      const res = await api.patch("config/doctor/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["config", "doctor"], data);
    },
  });

  // 🔹 Manejo de firma digital (preview)
  const handleSignatureChange = (file: File) => URL.createObjectURL(file);

  return {
    ...query,
    updateDoctor: mutation.mutateAsync,
    handleSignatureChange,
  };
}
