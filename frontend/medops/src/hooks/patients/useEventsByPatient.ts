// src/hooks/useEventsByPatient.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export interface PatientEvent {
  id: number;
  timestamp: string;
  actor?: string;
  entity: string;
  entity_id: number | string;
  action: string;
  metadata?: Record<string, any>;
}

interface EventsResult {
  list: PatientEvent[];
  totalCount: number;
}

async function fetchEventsByPatient(patientId: number): Promise<PatientEvent[]> {
  return apiFetch<PatientEvent[]>(`audit/patient/${patientId}/`);
}

export function useEventsByPatient(patientId: number) {
  return useQuery<PatientEvent[], Error, EventsResult>({
    queryKey: ["events", patientId],
    queryFn: () => fetchEventsByPatient(patientId),
    enabled: !!patientId,
    select: (data) => ({
      list: data,
      totalCount: data.length,
    }),
  });
}
