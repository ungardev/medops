import { useQueryClient } from "@tanstack/react-query";

export function useInvalidateChargeOrders() {
  const queryClient = useQueryClient();

  return (orderId?: number | string) => {
    // 🔹 Invalida la lista completa
    queryClient.invalidateQueries({ queryKey: ["charge-orders"] });

    // 🔹 Invalida el detalle y eventos de una orden específica
    if (orderId) {
      queryClient.invalidateQueries({ queryKey: ["charge-order", String(orderId)] });
      queryClient.invalidateQueries({ queryKey: ["charge-order-events", String(orderId)] });
    }
  };
}
