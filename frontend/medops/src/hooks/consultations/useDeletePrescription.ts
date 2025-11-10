// src/hooks/consultations/useDeletePrescription.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export function useDeletePrescription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`prescriptions/${id}/`, { method: "DELETE" });
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
            prescriptions: diag.prescriptions.filter((p: any) => p.id !== id),
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
