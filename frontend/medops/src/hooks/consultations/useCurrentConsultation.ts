// src/hooks/consultations/useCurrentConsultation.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateAppointmentNotes,
  updateAppointmentStatus,
} from "../../api/appointments";
import type { Appointment as ClinicalAppointment, AppointmentStatus } from "../../types/appointments";
import type { AppointmentUI } from "../../utils/appointmentMapper";
import { mapAppointment } from "../../utils/appointmentMapper";
import { apiFetch } from "@/api/client";
export function useCurrentConsultation() {
  const queryClient = useQueryClient();
  // 1. QUERY: Obtener la consulta activa
  const consultationQuery = useQuery<AppointmentUI | null>({
    queryKey: ["appointment", "current"],
    queryFn: async () => {
      const res = await apiFetch("consultations/current/");
      if (!res) return null;
      const clinical = res as ClinicalAppointment;
      // mapAppointment normaliza status y maneja el cronómetro con started_at
      return mapAppointment(clinical);
    },
    refetchInterval: 30_000, // Refresco automático cada 30s
    staleTime: 10_000,
  });
  // 2. MUTACIÓN: Actualizar Notas (con Invalidación Local)
  const updateNotes = useMutation({
    mutationFn: (data: { id: number; notes: string }) =>
      updateAppointmentNotes(data.id, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
  // 3. MUTACIÓN: Actualizar Estado (con Invalidación Cruzada)
  const updateStatus = useMutation({
    mutationFn: (data: { id: number; status: AppointmentStatus }) =>  // ✅ CORREGIDO: AppointmentStatus en lugar de string
      updateAppointmentStatus(data.id, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
      
      // LIMPIEZA DE SALA DE ESPERA: Esto saca al paciente de WaitingRoom.tsx
      queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] });
      queryClient.invalidateQueries({ queryKey: ["waitingRoomGroupsToday"] });
      
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