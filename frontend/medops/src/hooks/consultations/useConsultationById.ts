// src/hooks/consultations/useConsultationById.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { Appointment } from "../../types/appointments";

async function fetchConsultationById(id: number): Promise<Appointment | null> {
  if (!id || isNaN(id)) return null; // ✅ blindaje contra NaN o 0
  return apiFetch<Appointment>(`appointments/${id}/`); // ✅ ruta corregida
}

export function useConsultationById(id: number) {
  return useQuery<Appointment | null, Error>({
    queryKey: ["consultation", id],
    queryFn: () => fetchConsultationById(id),
    enabled: !!id && !isNaN(id), // ✅ solo activa si el ID es válido
  });
}
