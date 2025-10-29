// src/hooks/usePatient.ts
import { useQuery } from "@tanstack/react-query";
import { getPatient } from "api/patients";
import { Patient } from "types/patients";

export function usePatient(patientId: number) {
  return useQuery<Patient, Error>({
    queryKey: ["patient", patientId],
    queryFn: () => getPatient(patientId),
    enabled: !!patientId,
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
