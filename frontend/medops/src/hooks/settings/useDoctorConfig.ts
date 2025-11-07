import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface DoctorConfig {
  id?: number;
  fullName: string;
  colegiadoId: string;
  specialty?: string;
  license?: string;
  email?: string;
  phone?: string;
  signature?: string; // URL de la firma digital
}

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
      const res = await axios.patch<DoctorConfig>(
        "config/doctor/",
        newSettings
      );
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["config", "doctor"], data);
    },
  });

  // 🔹 Manejo de firma digital (preview)
  const handleSignatureChange = (file: File) => {
    return URL.createObjectURL(file);
    // En producción: enviar como multipart/form-data
  };

  return {
    ...query, // data, isLoading, isError
    updateDoctor: mutation.mutateAsync,
    handleSignatureChange,
  };
}
