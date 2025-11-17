// src/hooks/consultations/useUpdateTreatment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Treatment } from "../../types/consultation"; // 👈 tipado explícito

// 👇 ahora incluye status y treatment_type alineados con backend
export interface UpdateTreatmentInput {
  id: number;
  plan?: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: "active" | "completed" | "cancelled"; // 👈 corregido
  treatment_type?: "pharmacological" | "surgical" | "rehabilitation" | "lifestyle" | "other"; // 👈 corregido
}

interface MutationContext {
  previous: unknown;
}

export function useUpdateTreatment() {
  const queryClient = useQueryClient();

  return useMutation<Treatment, Error, UpdateTreatmentInput, MutationContext>({
    mutationFn: async ({ id, ...data }) => {
      console.debug("Payload enviado a PATCH /api/treatments/:id", data);
      return apiFetch<Treatment>(`treatments/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onMutate: async ({ id, ...data }) => {
      await queryClient.cancelQueries({ queryKey: ["consultation", "current"] });
      const previous = queryClient.getQueryData(["consultation", "current"]);

      queryClient.setQueryData(["consultation", "current"], (old: any) => {
        if (!old?.diagnoses) return old;
        return {
          ...old,
          diagnoses: old.diagnoses.map((diag: any) => ({
            ...diag,
            treatments: diag.treatments.map((t: any) =>
              t.id === id ? { ...t, ...data } : t
            ),
          })),
        };
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["consultation", "current"], ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
    },
  });
}
