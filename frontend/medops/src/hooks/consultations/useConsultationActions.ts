// src/hooks/consultations/useConsultationActions.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Appointment } from "../../types/appointments";

interface UpdateStatusInput {
  id: number;
  status: "completed" | "canceled";
}

export function useConsultationActions(): {
  complete: (id: number) => Promise<Appointment>;
  cancel: (id: number) => Promise<Appointment>;
  isPending: boolean;
} {
  const queryClient = useQueryClient();

  const mutation = useMutation<Appointment, Error, UpdateStatusInput>({
    mutationFn: async (data: UpdateStatusInput): Promise<Appointment> => {
      console.log("[useConsultationActions] PATCH request:", data);
      const response = await apiFetch<Appointment>(`appointments/${data.id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status: data.status }),
      });
      console.log("[useConsultationActions] PATCH response:", response);
      return response;
    },
    onSuccess: (data, variables) => {
      console.log("[useConsultationActions] Mutation success:", { data, variables });
      // 🔹 Invalidate queries so UI refreshes
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error, variables) => {
      console.error("[useConsultationActions] Mutation error:", { error, variables });
    },
    onSettled: (data, error, variables) => {
      console.log("[useConsultationActions] Mutation settled:", { data, error, variables });
    },
  });

  return {
    complete: (id: number) => mutation.mutateAsync({ id, status: "completed" }),
    cancel: (id: number) => mutation.mutateAsync({ id, status: "canceled" }),
    isPending: mutation.isPending,
  };
}
