// src/hooks/consultations/useUpdateDiagnosis.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Diagnosis } from "../../types/consultation";
interface UpdateDiagnosisInput {
  id: number;
  [key: string]: any;
}
interface MutationContext {
  previous: unknown;
}
export function useUpdateDiagnosis() {
  const queryClient = useQueryClient();
  return useMutation<Diagnosis, Error, UpdateDiagnosisInput, MutationContext>({
    mutationFn: async ({ id, ...data }) => {
      // 🔹 filtramos undefined para no enviar campos vacíos
      const body = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      );
      return apiFetch<Diagnosis>(`diagnoses/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ["appointment", "current"] });
      const previous = queryClient.getQueryData(["appointment", "current"]);
      // 🔹 Optimistic update
      queryClient.setQueryData(["appointment", "current"], (old: any) => {
        if (!old?.diagnoses) return old;
        return {
          ...old,
          diagnoses: old.diagnoses.map((d: any) =>
            d.id === id ? { ...d, ...data } : d
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