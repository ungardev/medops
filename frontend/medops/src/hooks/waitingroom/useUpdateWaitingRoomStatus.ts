// src/hooks/useUpdateWaitingRoomStatus.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export function useUpdateWaitingRoomStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    /**
     * Actualiza el estado de una entrada en la sala de espera.
     * Nota: Gracias a la sincronización en el modelo Appointment, 
     * al actualizar una cita, el backend ya se encarga de la coherencia.
     */
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiFetch(`waitingroom/${id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      // 🔹 Invalida las listas para que el frontend refleje los cambios del backend inmediatamente
      queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] });
      queryClient.invalidateQueries({ queryKey: ["waitingroomGroupsToday"] });
      
      // 🔹 También invalidamos la consulta actual por si el cambio vino desde otro componente
      queryClient.invalidateQueries({ queryKey: ["currentConsultation"] });
    },
  });
}
