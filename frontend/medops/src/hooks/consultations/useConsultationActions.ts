// src/hooks/consultations/useConsultationActions.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
interface UpdateStatusInput {
  id: number;
  status: string;
}
export function useConsultationActions() {
  const queryClient = useQueryClient();
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: UpdateStatusInput) => {
      return apiFetch(`appointments/${id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
  return { updateStatus };
}