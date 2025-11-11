// src/hooks/consultations/useUpdatePrescription.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Prescription } from "../../types/consultation";

export interface UpdatePrescriptionInput {
  id: number;
  medication?: string;
  dosage?: string | null;
  duration?: string | null;
}

// 👇 definimos el tipo de contexto
interface MutationContext {
  previous: unknown;
}

export function useUpdatePrescription() {
  const queryClient = useQueryClient();

  return useMutation<Prescription, Error, UpdatePrescriptionInput, MutationContext>({
    mutationFn: async ({ id, ...data }) => {
      console.debug("Payload enviado a PATCH /api/prescriptions/:id", data);
      return apiFetch<Prescription>(`prescriptions/${id}/`, {
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
            prescriptions: diag.prescriptions.map((p: any) =>
              p.id === id ? { ...p, ...data } : p
            ),
          })),
        };
      });

      // 👇 devolvemos el contexto tipado
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
