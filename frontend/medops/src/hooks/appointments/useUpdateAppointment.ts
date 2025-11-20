// src/hooks/appointments/useUpdateAppointment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Appointment, AppointmentInput } from "../../types/appointments";
import { apiFetch } from "../../api/client"; // 👈 usa tu helper centralizado

// --- PATCH/PUT: actualizar cita ---
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AppointmentInput }) => {
      const raw = await apiFetch<Appointment>(`appointments/${id}/`, {
        method: "PATCH", // o "PUT" si tu backend lo requiere
        body: JSON.stringify(data),
      });
      return raw;
    },
    onSuccess: (_data, variables) => {
      // ✅ Invalida la cache para refrescar lista y detalle
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointments", variables.id] });
    },
  });
}