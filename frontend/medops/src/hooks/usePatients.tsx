// src/hooks/usePatients.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/client";

// 🔹 Tipo de paciente según lo que devuelve PatientListSerializer
export interface Patient {
  id: number;
  full_name: string;
  age: number | null;
  gender: string | null;
  contact_info: string | null;
}

// 🔹 Función que consulta la API
async function fetchPatients(): Promise<Patient[]> {
  return apiFetch("patients/"); // GET /api/patients/
}

// 🔹 Hook que expone la data a los componentes
export function usePatients() {
  return useQuery<Patient[]>({
    queryKey: ["patients"],
    queryFn: fetchPatients,
    staleTime: 60_000, // cache 1 minuto
  });
}
