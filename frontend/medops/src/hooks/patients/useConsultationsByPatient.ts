// src/hooks/useConsultationsByPatient.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { Appointment } from "../../types/appointments";

interface ConsultationsResult {
  list: Appointment[];
  totalCount: number;
}

async function fetchConsultationsByPatient(patientId: number): Promise<Appointment[]> {
  const all = await apiFetch<Appointment[]>(`appointments/?patient=${patientId}`);
  return all.filter((a) => a.status === "completed");
}

export function useConsultationsByPatient(patientId: number) {
  return useQuery<Appointment[], Error, ConsultationsResult>({
    queryKey: ["consultations", patientId],
    queryFn: () => fetchConsultationsByPatient(patientId),
    enabled: !!patientId,
    select: (data) => ({
      list: data,
      totalCount: data.length,
    }),
  });
}
