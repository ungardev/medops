// src/hooks/consultations/useNotes.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

interface UpdateNotesInput {
  id: number;   // ID de la cita
  notes: string;
}

export function useUpdateNotes() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: UpdateNotesInput) => {
      return apiFetch(`appointments/${data.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ notes: data.notes }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending, // ✅ v5
  };
}
