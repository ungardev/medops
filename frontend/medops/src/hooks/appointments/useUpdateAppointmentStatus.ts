// src/hooks/appointments/useUpdateAppointmentStatus.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { Appointment } from "../../types/appointments";

interface UpdateStatusInput {
  id: number;
  status: string;
}

// --- PATCH: actualizar estado de cita ---
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: UpdateStatusInput) => {
      const raw = await apiFetch<Appointment>(`appointments/${id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return raw;
    },
    onSuccess: (_data, variables) => {
      // ✅ Invalida tanto la lista como el detalle de la cita
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments", variables.id] });

      // 🔎 Mantén también las invalidaciones clínicas si son necesarias
      queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] });
      queryClient.invalidateQueries({ queryKey: ["consultation", "current"] });
    },
  });
}