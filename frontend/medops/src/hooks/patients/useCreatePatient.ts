// src/hooks/patients/useCreatePatient.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPatient } from "api/patients";
import { Patient, PatientInput } from "types/patients";

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation<Patient, Error, PatientInput>({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
