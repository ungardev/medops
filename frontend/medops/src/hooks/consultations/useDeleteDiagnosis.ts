// src/hooks/consultations/useDeleteDiagnosis.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export function useDeleteDiagnosis() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: number) => {
      return apiFetch(`diagnoses/${id}/`, {
        method: "DELETE",
      });
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ["consultation", "current"] });

      const previous = queryClient.getQueryData(["consultation", "current"]);

      queryClient.setQueryData(["consultation", "current"], (old: any) => {
        if (!old?.diagnoses) return old;
        return {
          ...old,
          diagnoses: old.diagnoses.filter((d: any) => d.id !== id),
        };
      });

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["consultation", "current"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}
