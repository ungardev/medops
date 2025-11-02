// src/hooks/consultations/useConsultationActions.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

interface UpdateStatusInput {
  id: number;
  status: "completed" | "canceled";
}

export function useConsultationActions() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: UpdateStatusInput) => {
      return apiFetch(`appointments/${data.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: data.status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  return {
    complete: (id: number) => mutation.mutate({ id, status: "completed" }),
    cancel: (id: number) => mutation.mutate({ id, status: "canceled" }),
    isPending: mutation.isPending,
  };
}
