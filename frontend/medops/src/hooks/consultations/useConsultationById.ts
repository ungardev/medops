// src/hooks/consultations/useConsultationById.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { Appointment } from "../../types/appointments";

async function fetchConsultationById(id: number): Promise<Appointment | null> {
  if (!id) return null;
  return apiFetch<Appointment>(`consultations/${id}/`);
}

export function useConsultationById(id: number) {
  return useQuery<Appointment | null, Error>({
    queryKey: ["consultation", id],
    queryFn: () => fetchConsultationById(id),
    enabled: !!id,
  });
}
