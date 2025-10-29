// src/hooks/usePatients.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { Patient } from "types/patients";

async function fetchPatients(): Promise<Patient[]> {
  return apiFetch<Patient[]>("patients/");
}

export function usePatients() {
  return useQuery<Patient[], Error>({
    queryKey: ["patients"],
    queryFn: fetchPatients,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
