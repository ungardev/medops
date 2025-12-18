// src/hooks/patients/useCreateGeneticPredisposition.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { GeneticPredisposition } from "./useGeneticPredispositions";

interface CreateGeneticPredispositionInput {
  name: string;
  description?: string;
}

/**
 * Hook institucional para crear una nueva predisposición genética.
 * - Usa React Query mutation
 * - Invalidación automática del catálogo
 */
async function createGeneticPredisposition(
  payload: CreateGeneticPredispositionInput
): Promise<GeneticPredisposition> {
  return apiFetch<GeneticPredisposition>("genetic-predispositions/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function useCreateGeneticPredisposition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGeneticPredisposition,
    onSuccess: () => {
      // Invalidamos catálogo para que siempre refleje las nuevas opciones
      queryClient.invalidateQueries({
        queryKey: ["genetic-predispositions"],
      });
    },
  });
}
