// src/hooks/consultations/useDeleteTreatment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
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
      // 🔧 FIX: Cancelar queries con la key correcta
      await queryClient.cancelQueries({ queryKey: ["appointment", "current"] });
      const previous = queryClient.getQueryData(["appointment", "current"]);
      // 🔹 Optimistic update: eliminamos el tratamiento del cache
      queryClient.setQueryData(["appointment", "current"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          treatments: old.treatments?.filter((t: any) => t.id !== id) || [],
        };
      });
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      // 🔹 Rollback si falla
      if (ctx?.previous) {
        queryClient.setQueryData(["appointment", "current"], ctx.previous);
      }
    },
    onSettled: () => {
      // 🔹 Refresca datos reales desde backend
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
}