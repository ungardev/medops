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
    mutationFn: async (payload: any) => {
      // Si el payload es FormData, Axios enviará multipart/form-data automáticamente.
      // Si es un objeto literal {}, Axios enviará application/json.
      const res = await api.patch<InstitutionSettings>("config/institution/", payload);
      return res.data;
    },
    onSuccess: (data) => {
      // Actualización inmediata del estado global
      queryClient.setQueryData(["config", "institution"], data);
      queryClient.invalidateQueries({ queryKey: ["config", "institution"] });
    },
    onError: (error) => {
      console.error("CRITICAL_UPDATE_ERROR:", error);
    }
  });

  return {
    ...query,
    updateInstitution: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    // Helper para previsualización local
    generatePreviewUrl: (file: File) => URL.createObjectURL(file),
  };
}
