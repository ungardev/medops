// src/hooks/consultations/useDeleteTreatment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export function useDeleteTreatment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`treatments/${id}/`, { method: "DELETE" });
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ["consultation", "current"] });
      const previous = queryClient.getQueryData(["consultation", "current"]);

      queryClient.setQueryData(["consultation", "current"], (old: any) => {
        if (!old?.diagnoses) return old;
        return {
          ...old,
          diagnoses: old.diagnoses.map((diag: any) => ({
            ...diag,
            treatments: diag.treatments.filter((t: any) => t.id !== id),
          })),
        };
      });

      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["consultation", "current"], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
    },
  });
}
