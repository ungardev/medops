import { useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
const API_BASE = import.meta.env.VITE_API_URL;
export function useGenerateMedicalReport(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (appointmentId: number): Promise<void> => {
      const token = localStorage.getItem("authToken") || import.meta.env.VITE_DEV_TOKEN || "";
      const activeInstitutionId = localStorage.getItem("active_institution_id");
      
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Token ${token}` } : {}),
        ...(activeInstitutionId ? { "X-Institution-ID": activeInstitutionId } : {}),
      };
      
      const response = await fetch(
        `${API_BASE}/consultations/${appointmentId}/generate-report/`,
        {
          method: "POST",
          headers,
        }
      );
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
      }
      
      // ✅ El backend devuelve PDF, no JSON
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `medical_report_${appointmentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      // Invalida cache de documentos
      queryClient.invalidateQueries({
        queryKey: ["documents"],
      });
      queryClient.invalidateQueries({
        queryKey: ["patient-documents"],
      });
    },
  });
}