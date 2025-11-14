// src/hooks/consultations/useUpdatePrescription.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Prescription, UpdatePrescriptionInput } from "../../types/consultation";

interface MutationContext {
  previous: unknown;
}

export function useUpdatePrescription() {
  const queryClient = useQueryClient();

  return useMutation<Prescription, Error, UpdatePrescriptionInput, MutationContext>({
    mutationFn: async ({ id, ...data }) => {
      console.debug("Payload enviado a PATCH /api/prescriptions/:id", data);

      // 🔹 filtramos undefined para no enviar campos vacíos
      const body = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      );

      return apiFetch<Prescription>(`prescriptions/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(body),
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
            prescriptions: diag.prescriptions.map((p: any) =>
              p.id === id ? { ...p, ...data } : p
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
