import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Appointment as ClinicalAppointment } from "../../types/consultation";
import type { AppointmentUI } from "../../utils/appointmentMapper";
import { mapAppointment } from "../../utils/appointmentMapper";

/**
 * Hook genérico para obtener cualquier Appointment por ID.
 * Devuelve un AppointmentUI ya normalizado para la UI.
 */
export function useAppointment(id: number) {
  return useQuery<AppointmentUI | null>({
    queryKey: ["consultation", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiFetch(`consultations/${id}/`);
      if (!res) return null;
      const clinical = res as ClinicalAppointment;
      return mapAppointment(clinical);
    },
    enabled: !!id, // solo ejecuta si hay id válido
    refetchInterval: 30_000, // 🔄 refresco automático opcional
  });
}
