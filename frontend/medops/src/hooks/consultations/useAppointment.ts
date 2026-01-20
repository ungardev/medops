// src/hooks/consultations/useAppointment.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { Appointment } from "../../types/appointments";
import type { AppointmentUI } from "../../utils/appointmentMapper";
import { mapAppointment } from "../../utils/appointmentMapper";
/**
 * Hook genérico para obtener cualquier Appointment por ID.
 * Devuelve un AppointmentUI ya normalizado para la UI.
 */
export function useAppointment(id: number) {
  return useQuery<AppointmentUI | null>({
    queryKey: ["appointment", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiFetch(`appointments//`);
      if (!res) return null;
      const appointment = res as Appointment;
      return mapAppointment(appointment);
    },
    enabled: !!id, // solo ejecuta si hay id válido
    refetchInterval: 30_000, // 🔄 refresco automático opcional
  });
}