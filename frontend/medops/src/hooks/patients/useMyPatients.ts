// src/hooks/patients/useMyPatients.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { Patient } from "@/types/patients";

export interface MyPatient {
  relationship_id: number;
  patient_id: number;
  full_name: string;
  national_id: string | null;
  age: number | null;
  is_minor: boolean;
  relationship_type: string;
  relationship_type_display: string;
  institution_name: string | null;
  created_at: string | null;
}

interface MyPatientsResponse {
  patients: MyPatient[];
}

async function fetchMyPatients(): Promise<Patient[]> {
  const response = await apiFetch<MyPatientsResponse>(
    "doctor-patient-relationships/my-patients/"
  );
  
  if (!response || !Array.isArray(response.patients)) {
    console.warn("[useMyPatients] Respuesta no mapeable.", response);
    return [];
  }
  
  return response.patients.map((p) => ({
    id: p.patient_id,
    full_name: p.full_name,
    national_id: p.national_id,
    email: null,
    is_minor: p.is_minor,
  })) as Patient[];
}

export function useMyPatients() {
  return useQuery<Patient[], Error>({
    queryKey: ["doctor", "my-patients"],
    queryFn: fetchMyPatients,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
  });
}