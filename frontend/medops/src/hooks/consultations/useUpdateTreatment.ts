// src/hooks/consultations/useUpdateTreatment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Treatment, UpdateTreatmentInput } from "../../types/consultation";
interface MutationContext {
  previous: unknown;
}
export function useUpdateTreatment() {
  const queryClient = useQueryClient();
  return useMutation<Treatment, Error, UpdateTreatmentInput, MutationContext>({
    mutationFn: async ({ id, ...data }) => {
      // 🔹 filtramos undefined para no enviar campos vacíos
      const body = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      );
      return apiFetch<Treatment>(`treatments/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ["appointment", "current"] });
      const previous = queryClient.getQueryData(["appointment", "current"]);
      // 🔹 Optimistic update
      queryClient.setQueryData(["appointment", "current"], (old: any) => {
        if (!old?.treatments) return old;
        return {
          ...old,
          treatments: old.treatments.map((t: any) =>
            t.id === id ? { ...t, ...data } : t
          ),
        };
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["appointment", "current"], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
}