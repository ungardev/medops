import { useQuery } from '@tanstack/react-query';
import { patientClient } from '@/api/patient/client';
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
  return useQuery({
    queryKey: ['patient', 'charge-order', orderId],
    queryFn: async () => {
      const response = await patientClient.getChargeOrderDetail(orderId);
      return response.data;
    },
    enabled: !!orderId,
  });
}