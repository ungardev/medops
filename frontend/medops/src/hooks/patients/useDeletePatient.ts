// src/hooks/patients/useDeletePatient.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePatient } from "api/patients";

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: deletePatient,
    onSuccess: () => {
      // 🔒 invalida todas las queries que empiezan con "patients"
      queryClient.invalidateQueries({ queryKey: ["patients"], exact: false });
      // ⚔️ forzar refetch inmediato de la lista activa
      queryClient.refetchQueries({ queryKey: ["patients"], exact: false });
    },
  });
}
