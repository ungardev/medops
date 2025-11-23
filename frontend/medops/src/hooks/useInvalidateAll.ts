// src/hooks/useInvalidateAll.ts
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook institucional para invalidar todos los circuitos críticos:
 * - Pagos
 * - Órdenes de cobro
 * - Notificaciones
 * - Auditoría
 */
export function useInvalidateAll() {
  const queryClient = useQueryClient();

  return (opts?: { paymentId?: number; chargeOrderId?: number }) => {
    // 🔹 Pagos
    if (opts?.paymentId) {
      queryClient.invalidateQueries({ queryKey: ["payments", opts.paymentId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    }

    // 🔹 Órdenes de cobro
    if (opts?.chargeOrderId) {
      queryClient.invalidateQueries({ queryKey: ["charge-orders", opts.chargeOrderId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["charge-orders"] });
    }

    // 🔹 Notificaciones
    queryClient.invalidateQueries({ queryKey: ["notifications"] });

    // 🔹 Auditoría
    queryClient.invalidateQueries({ queryKey: ["audit-log"] });
  };
}
