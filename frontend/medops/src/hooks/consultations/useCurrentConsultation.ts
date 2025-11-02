// src/hooks/consultations/useCurrentConsultation.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Appointment as ClinicalAppointment } from "../../types/consultation";
import type { AppointmentUI } from "../../utils/appointmentMapper";
import { mapAppointment } from "../../utils/appointmentMapper";

export function useCurrentConsultation() {
  return useQuery<AppointmentUI | null>({
    queryKey: ["consultation", "current"],
    queryFn: async () => {
      // ✅ corregido: singular "consultation"
      const res = await apiFetch("consultation/current/");
      if (!res) return null;
      const clinical = res as ClinicalAppointment;
      return mapAppointment(clinical);
    },
    refetchInterval: 30_000, // 🔄 refresco automático
  });
}
