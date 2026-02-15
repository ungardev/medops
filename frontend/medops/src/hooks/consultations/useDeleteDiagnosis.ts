// src/hooks/consultations/useDeleteDiagnosis.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
interface MutationContext {
  previous: unknown;
}
export function useDeleteDiagnosis() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number, MutationContext>({
    mutationFn: async (id: number) => {
      return apiFetch(`diagnoses/${id}/`, {
        method: "DELETE",
      });
    },
    onMutate: async (id: number) => {
      // 🔧 FIX: Usar la key correcta ["appointment", "current"]
      await queryClient.cancelQueries({ queryKey: ["appointment", "current"] });
      const previous = queryClient.getQueryData(["appointment", "current"]);
      // 🔹 Optimistic update: eliminar del cache
      queryClient.setQueryData(["appointment", "current"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          diagnoses: old.diagnoses?.filter((d: any) => d.id !== id) || [],
        };
      });
      return { previous };
    },
    onError: (_error, _id, context) => {
      // 🔹 Rollback si falla
      if (context?.previous) {
        queryClient.setQueryData(["appointment", "current"], context.previous);
      }
    },
    onSettled: () => {
      // 🔹 Refrescar datos desde el backend
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
}