// src/hooks/patients/useDeletePatient.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePatient } from "api/patients";

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
