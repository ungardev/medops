import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { DoctorConfig } from "@/types/config";

export function useDoctorConfig() {
  const queryClient = useQueryClient();

  // 🔹 GET configuración del médico operador
  const query = useQuery<DoctorConfig>({
    queryKey: ["config", "doctor"],
    queryFn: async () => {
      const res = await axios.get<DoctorConfig>("config/doctor/");
      return res.data;
    },
  });

  // 🔹 PATCH actualización del médico operador (parcial)
  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<DoctorConfig>) => {
      const sig = newSettings.signature;
      if (sig && sig instanceof File) {
        const formData = new FormData();
        if (newSettings.full_name) formData.append("full_name", newSettings.full_name);
        if (newSettings.colegiado_id) formData.append("colegiado_id", newSettings.colegiado_id);
        if (newSettings.specialty) formData.append("specialty", newSettings.specialty);
        if (newSettings.license) formData.append("license", newSettings.license);
        if (newSettings.email) formData.append("email", newSettings.email);
        if (newSettings.phone) formData.append("phone", newSettings.phone);
        formData.append("signature", sig);

        const res = await axios.patch("config/doctor/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
      } else {
        const res = await axios.patch("config/doctor/", newSettings);
        return res.data;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["config", "doctor"], data);
    },
  });

  // 🔹 Manejo de firma digital (preview)
  const handleSignatureChange = (file: File) => {
    return URL.createObjectURL(file);
  };

  return {
    ...query,
    updateDoctor: mutation.mutateAsync,
    handleSignatureChange,
  };
}
