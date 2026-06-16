// src/hooks/usePatient.ts
import { useQuery } from "@tanstack/react-query";
import { getPatient } from "api/patients";
import { Patient, PatientClinicalProfile } from "types/patients";
import { queryClient } from "@/lib/reactQuery";

const PATIENT_CACHE_KEY = 'medops_patient_cache';

function getCachedPatient(patientId: number): PatientClinicalProfile | undefined {
  try {
    const cached = localStorage.getItem(`${PATIENT_CACHE_KEY}_${patientId}`);
    if (cached) {
      return JSON.parse(cached) as PatientClinicalProfile;
    }
  } catch {}

  const queryCached = queryClient.getQueryData<PatientClinicalProfile>(["patient", patientId]);
  if (queryCached) {
    return queryCached;
  }

  return undefined;
}

export function setPatientCache(patient: PatientClinicalProfile): void {
  try {
    localStorage.setItem(`${PATIENT_CACHE_KEY}_${patient.id}`, JSON.stringify(patient));
  } catch {}
}

export function usePatient(patientId: number) {
  return useQuery<PatientClinicalProfile>({
    queryKey: ["patient", patientId],
    queryFn: () => getPatient(patientId),
    enabled: !!patientId,
    staleTime: 30 * 60 * 1000,
    gcTime: Infinity,
    retry: 1,
    refetchOnWindowFocus: false,
    initialData: getCachedPatient(patientId),
  });
}
