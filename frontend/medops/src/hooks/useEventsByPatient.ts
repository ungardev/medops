// src/hooks/useEventsByPatient.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/client";

export interface Event {
  id: number;
  timestamp: string;
  actor?: string;
  entity: string;
  entity_id: number;
  action: string;
  metadata?: Record<string, any>;
}

async function fetchEventsByPatient(patientId: number): Promise<Event[]> {
  // Endpoint esperado: GET /api/audit/patient/{id}/
  return apiFetch(`audit/patient/${patientId}/`);
}

export function useEventsByPatient(patientId: number) {
  return useQuery<Event[]>({
    queryKey: ["events", patientId],
    queryFn: () => fetchEventsByPatient(patientId),
    enabled: !!patientId,
  });
}
