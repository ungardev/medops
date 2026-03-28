import { useQuery } from '@tanstack/react-query';
import { patientClient } from '@/api/patient/client';
import type { PatientChargeOrder } from '@/types/patient';
export function usePatientChargeOrders() {
  return useQuery({
    queryKey: ['patient', 'charge-orders'],
    queryFn: async () => {
      const response = await patientClient.getChargeOrders();
      return response.data;
    },
  });
}
export function usePatientChargeOrderDetail(orderId: number) {
  return useQuery<PatientChargeOrder>({
    queryKey: ['patient', 'charge-order', orderId],
    queryFn: async () => {
      const response = await patientClient.getChargeOrderDetail(orderId);
      return response.data;
    },
    enabled: !!orderId,
    // ✅ NUEVO: Polling condicional - solo cuando hay pagos pendientes
    refetchInterval: (query) => {
      const data = query.state.data as PatientChargeOrder | undefined;
      const hasPendingPayments = data?.payments?.some(p => p.status === 'pending');
      return hasPendingPayments ? 10000 : false; // 10 segundos si hay pendientes
    },
    refetchOnWindowFocus: true,
  });
}