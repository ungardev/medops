// src/hooks/usePatient.ts
import { useQuery } from "@tanstack/react-query";
import { getPatient } from "api/patients";
import { Patient } from "types/patients";

export function usePatient(patientId: number) {
  return useQuery<Patient>({
    queryKey: ["patient", patientId],
    queryFn: () => getPatient(patientId),
    enabled: !!patientId,        // solo corre si hay un id válido
    staleTime: 60_000,           // cache fresco por 1 minuto
    retry: 1,                    // reintenta una vez si falla
    refetchOnWindowFocus: false, // no recarga al cambiar de pestaña
  });
}
