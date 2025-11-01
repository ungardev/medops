import { useQuery } from "@tanstack/react-query";
import { getPaymentSummary } from "../../api/payments";

// --- Tipo de respuesta del endpoint /payments/summary/
export interface PaymentSummaryItem {
  method: string;   // "cash" | "card" | "transfer"
  total: number;    // monto total por método
}

// Hook para consumir el resumen de pagos
export function usePaymentSummary() {
  return useQuery<PaymentSummaryItem[]>({
    queryKey: ["payments", "summary"],
    queryFn: getPaymentSummary,
  });
}
