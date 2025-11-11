import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

// 👇 definimos el tipo de contexto para rollback
interface MutationContext {
  previous: unknown;
}

export function useDeleteTreatment() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number, MutationContext>({
    mutationFn: async (id: number) => {
      return apiFetch(`treatments/${id}/`, { method: "DELETE" });
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ["consultation", "current"] });
      const previous = queryClient.getQueryData(["consultation", "current"]);

      // 🔹 Optimistic update: eliminamos el tratamiento del cache
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

      // 👇 devolvemos el contexto tipado
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      // 🔹 rollback si falla
      if (ctx?.previous) {
        queryClient.setQueryData(["consultation", "current"], ctx.previous);
      }
    },
    onSettled: () => {
      // 🔹 refresca datos reales desde backend
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
    },
  });
}
