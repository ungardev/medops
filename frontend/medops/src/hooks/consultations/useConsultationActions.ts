// src/hooks/consultations/useConsultationActions.ts
import { useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Appointment } from "../../types/appointments";

interface UpdateStatusInput {
  id: number;
  status: "completed" | "canceled";
}

export function useConsultationActions(): {
  complete: (id: number) => void;
  cancel: (id: number) => void;
  isPending: boolean;
} {
  const queryClient = useQueryClient();

  const mutation: UseMutationResult<Appointment, Error, UpdateStatusInput> = useMutation({
    mutationFn: async (data: UpdateStatusInput): Promise<Appointment> => {
      return apiFetch<Appointment>(`appointments/${data.id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status: data.status }),
      });
    },
    onSuccess: () => {
      // 🔹 Invalidate queries so UI refreshes
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
