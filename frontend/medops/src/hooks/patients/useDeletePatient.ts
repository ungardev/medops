// src/hooks/patients/useDeletePatient.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePatient } from "../../api/patients";

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (id: number) => {
      console.log("[HOOK] ejecutando deletePatient con id", id);
      return deletePatient(id);
    },
    onSuccess: () => {
      console.log("[DELETE HOOK] invalidando queries de pacientes…");
      queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "patients",
      });
    },
  });
}
