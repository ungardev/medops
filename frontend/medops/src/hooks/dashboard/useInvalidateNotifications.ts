// src/hooks/dashboard/useInvalidateNotifications.ts
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook institucional para invalidar el feed de notificaciones
 * Se usa después de registrar pagos, citas, entradas en sala de espera, etc.
 */
export function useInvalidateNotifications() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };
}
