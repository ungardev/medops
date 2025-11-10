// src/hooks/consultations/useUpdateDiagnosis.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export interface UpdateDiagnosisInput {
  id: number;
  description: string;
}

export function useUpdateDiagnosis() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, description }: UpdateDiagnosisInput) => {
      return apiFetch(`diagnoses/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ description }),
      });
    },
    onMutate: async ({ id, description }) => {
      await queryClient.cancelQueries({ queryKey: ["consultation", "current"] });

      const previous = queryClient.getQueryData(["consultation", "current"]);

      queryClient.setQueryData(["consultation", "current"], (old: any) => {
        if (!old?.diagnoses) return old;
        return {
          ...old,
          diagnoses: old.diagnoses.map((d: any) =>
            d.id === id ? { ...d, description } : d
          ),
        };
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["consultation", "current"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}
