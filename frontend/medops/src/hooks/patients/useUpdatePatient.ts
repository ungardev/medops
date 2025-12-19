// src/hooks/patients/useUpdatePatient.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePatient } from "../../api/patients";
import { PatientClinicalProfile, PatientInput } from "types/patients";

/**
 * Hook institucional para actualizar un paciente.
 * - Acepta PATCH parciales (Partial<PatientInput>)
 * - Devuelve el perfil clínico completo (PatientClinicalProfile)
 * - Invalida cache de detalle y lista para refrescar datos
 */
export function useUpdatePatient(id: number) {
  const queryClient = useQueryClient();

  return useMutation<PatientClinicalProfile, Error, Partial<PatientInput>>({
    mutationFn: (data: Partial<PatientInput>) => updatePatient(id, data),
    onSuccess: () => {
      // ✅ Forzar refetch del detalle del paciente (perfil clínico completo)
      queryClient.invalidateQueries({ queryKey: ["patient", id] });

      // ✅ También refrescar la lista de pacientes
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: (error) => {
      console.error("Error al actualizar paciente:", error);
    },
  });
}
