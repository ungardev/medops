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
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 60 * 60 * 1000,      // 1 hour
    refetchOnWindowFocus: false, // Don't refetch on tab switch
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
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 60 * 60 * 1000,      // 1 hour
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    // Polling condicional - solo cuando hay pagos pendientes
    refetchInterval: (query) => {
      const data = query.state.data as PatientChargeOrder | undefined;
      const hasPendingPayments = data?.payments?.some(p => p.status === 'pending');
      return hasPendingPayments ? 10000 : false; // 10 segundos si hay pendientes
    },
  });
}