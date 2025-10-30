// src/hooks/patients/useUpdatePatient.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePatient } from "../../api/patients";
import { Patient, PatientInput } from "types/patients";

export function useUpdatePatient(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PatientInput) => updatePatient(id, data),
    onSuccess: () => {
      // ✅ Forzar refetch del detalle del paciente para refrescar created_at y updated_at
      queryClient.invalidateQueries({ queryKey: ["patient", id] });

      // ✅ También refrescar la lista de pacientes
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (error) => {
      console.error("Error al actualizar paciente:", error);
    },
  });
}
