// src/hooks/appointments/useUpdateAppointmentStatus.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { AppointmentStatus } from "../../types/appointments";
interface UpdateStatusInput {
  id: number;
  status: AppointmentStatus;
  appointment_date?: string; // Opcional, para confirmar con fecha específica
}
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, appointment_date }: UpdateStatusInput) => {
      // 1. Si el estado es 'confirmed', usar el endpoint POST /confirm/
      if (status === 'arrived') {
        const body: any = {};
        if (appointment_date) {
          body.appointment_date = appointment_date;
        }
        
        // Nota: El backend ConfirmAppointmentView usa POST /appointments/{id}/confirm/
        return apiFetch(`appointments/${id}/confirm/`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      
      // 2. Para otros estados, usar el endpoint PATCH /status/
      return apiFetch(`appointments/${id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["operationalHub"] });
    },
  });
}