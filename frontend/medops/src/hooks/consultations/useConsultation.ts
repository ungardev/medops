import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentConsultation,
  updateAppointmentNotes,
  updateAppointmentStatus,
} from "../../api/consultation";
import { Appointment } from "../../types";
export function useConsultation() {
  const queryClient = useQueryClient();
  // 🔹 Consulta actual (puede ser null si no hay activa)
  const consultationQuery = useQuery<Appointment | null>({
    queryKey: ["appointment", "current"],
    queryFn: getCurrentConsultation,
    retry: false,
  });
  // 🔹 Mutación: actualizar notas
  const updateNotes = useMutation({
    mutationFn: (data: { id: number; notes: string }) =>
      updateAppointmentNotes(data.id, data.notes),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] }),
  });
  // 🔹 Mutación: actualizar estado
  const updateStatus = useMutation({
    mutationFn: (data: { id: number; status: string }) =>
      updateAppointmentStatus(data.id, data.status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] }),
  });
  return {
    consultationQuery,
    updateNotes,
    updateStatus,
  };
}