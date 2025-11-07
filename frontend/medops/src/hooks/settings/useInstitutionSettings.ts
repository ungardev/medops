import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export interface InstitutionSettings {
  id?: number;
  name: string;
  address: string;
  phone: string;
  tax_id: string;
  logo: string;
}

export function useInstitutionSettings() {
  const queryClient = useQueryClient();

  // 🔹 GET configuración institucional
  const query = useQuery<InstitutionSettings>({
    queryKey: ["config", "institution"],
    queryFn: async () => {
      const res = await axios.get<InstitutionSettings>("config/institution/");
      return res.data;
    },
  });

  // 🔹 PATCH actualización institucional (parcial)
  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<InstitutionSettings>) => {
      const res = await axios.patch<InstitutionSettings>(
        "config/institution/",
        newSettings
      );
      return res.data;
    },
    onSuccess: (data) => {
      // refresca cache
      queryClient.setQueryData(["config", "institution"], data);
    },
  });

  // 🔹 Manejo de logo preview
  const handleLogoChange = (file: File) => {
    return URL.createObjectURL(file);
    // En producción: enviar como multipart/form-data
  };

  return {
    ...query, // data, isLoading, isError
    updateInstitution: mutation.mutateAsync,
    handleLogoChange,
  };
}
