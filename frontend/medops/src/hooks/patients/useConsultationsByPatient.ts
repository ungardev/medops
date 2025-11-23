// src/hooks/patients/useConsultationsByPatient.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { Appointment } from "../../types/appointments";

interface ConsultationsResult {
  list: Appointment[];
  totalCount: number;
}

// Normaliza estado a minúsculas
function normalizeStatus(status?: string | null): boolean {
  const s = (status ?? "").toLowerCase().trim();
  return s === "completed" || s === "completada" || s === "completado";
}

async function fetchConsultationsByPatient(patientId: number): Promise<Appointment[]> {
  // 🔒 Tipamos explícitamente la respuesta como unknown
  const response: unknown = await apiFetch<unknown>(`appointments/?patient=${patientId}`);

  // 🔒 Defensivo: puede ser array plano o { results: [...] }
  let arr: Appointment[] = [];
  if (Array.isArray(response)) {
    arr = response as Appointment[];
  } else if (response && typeof response === "object" && Array.isArray((response as any).results)) {
    arr = (response as { results: Appointment[] }).results;
  }

  // 🔒 Tipado explícito en filter
  return arr.filter((a: Appointment) => normalizeStatus(a.status));
}

export function useConsultationsByPatient(patientId: number) {
  return useQuery<Appointment[], Error, ConsultationsResult>({
    queryKey: ["consultations", patientId],
    queryFn: () => fetchConsultationsByPatient(patientId),
    enabled: !!patientId,
    select: (data: Appointment[]) => ({
      list: Array.isArray(data) ? data : [],
      totalCount: Array.isArray(data) ? data.length : 0,
    }),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
