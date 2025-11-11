import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Treatment } from "../../types/consultation"; // 👈 tipado explícito

export interface UpdateTreatmentInput {
  id: number;
  plan: string;
  start_date?: string | null;
  end_date?: string | null;
}

// 👇 definimos el tipo de contexto con tipado más claro
interface MutationContext {
  previous: unknown; // puedes reemplazar unknown por el tipo de tu consulta si lo tienes
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

      // 🔹 Optimistic update en cache
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

      // 👇 devolvemos el contexto tipado
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
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
