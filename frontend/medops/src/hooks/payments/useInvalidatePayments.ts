import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook para invalidar queries relacionadas con pagos.
 * Se usa después de registrar/editar/eliminar un pago
 * para refrescar automáticamente la UI.
 */
export function useInvalidatePayments() {
  const queryClient = useQueryClient();

  return (paymentId?: number) => {
    // Invalida la lista global de pagos
    queryClient.invalidateQueries({ queryKey: ["payments"] });

    // Invalida pagos por paciente si lo usas en algún componente
    queryClient.invalidateQueries({ queryKey: ["payments-by-patient"] });

    // Invalida resumen global de pagos
    queryClient.invalidateQueries({ queryKey: ["payment-summary"] });

    // Si quieres invalidar un pago específico
    if (paymentId) {
      queryClient.invalidateQueries({ queryKey: ["payment", paymentId] });
    }
  };
}
