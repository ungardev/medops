// src/hooks/appointments/useUpdateAppointmentNotes.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { Appointment } from "../../types/appointments";

interface UpdateNotesInput {
  id: number;       // ID de la cita
  notes: string;    // Nuevo texto de notas
}

export function useUpdateAppointmentNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: UpdateNotesInput) => {
      const raw = await apiFetch<Appointment>(`/api/appointments/${id}/notes/`, {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      });
      return raw;
    },
    onSuccess: (_data, variables) => {
      // ✅ Invalida la cache de la cita específica y del listado
      queryClient.invalidateQueries({ queryKey: ["appointments", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
