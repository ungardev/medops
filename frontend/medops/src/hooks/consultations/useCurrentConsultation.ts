import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { 
  updateAppointmentNotes, 
  updateAppointmentStatus 
} from "../../api/consultation";
import type { Appointment as ClinicalAppointment } from "../../types/consultation";
import type { AppointmentUI } from "../../utils/appointmentMapper";
import { mapAppointment } from "../../utils/appointmentMapper";

export function useCurrentConsultation() {
  const queryClient = useQueryClient();

  // 1. QUERY: Obtener la consulta activa
  const consultationQuery = useQuery<AppointmentUI | null>({
    queryKey: ["consultation", "current"],
    queryFn: async () => {
      const res = await apiFetch("consultation/current/");
      if (!res) return null;

      const clinical = res as ClinicalAppointment;
      // mapAppointment normaliza status y maneja el cronómetro con started_at
      return mapAppointment(clinical);
    },
    refetchInterval: 30_000, // Refresco automático cada 30s
    staleTime: 10_000,
  });

  // 2. MUTATION: Actualizar Notas (con Invalida local)
  const updateNotes = useMutation({
    mutationFn: (data: { id: number; notes: string }) =>
      updateAppointmentNotes(data.id, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
    },
  });

  // 3. MUTATION: Actualizar Estado (con Invalidación Cruzada)
  const updateStatus = useMutation({
    mutationFn: (data: { id: number; status: string }) =>
      updateAppointmentStatus(data.id, data.status),
    onSuccess: () => {
      // Limpia la consulta actual para el médico
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
      
      // ⚡️ LIMPIEZA DE SALA DE ESPERA: Esto saca al paciente de WaitingRoom.tsx
      queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] });
      queryClient.invalidateQueries({ queryKey: ["waitingroomGroupsToday"] });
      
      // Sincroniza cualquier otra lista de citas hoy
      queryClient.invalidateQueries({ queryKey: ["appointmentsToday"] });
    },
  });

  return {
    consultationQuery,
    updateNotes,
    updateStatus,
  };
}
