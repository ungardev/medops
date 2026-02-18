// src/hooks/consultations/useNotes.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
interface UpdateNotesInput {
  appointmentId: number;
  notes: string;
}
export function useNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ appointmentId, notes }: UpdateNotesInput) => {
      return apiFetch(`appointments/${appointmentId}/notes/`, {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
}