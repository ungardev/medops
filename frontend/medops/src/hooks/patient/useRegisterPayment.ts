import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patientClient } from '@/api/patient/client';
import { RegisterPaymentRequest } from '@/types/patient';
export function useRegisterPayment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: number; data: RegisterPaymentRequest }) => {
      const response = await patientClient.registerPayment(orderId, data);
      return response.data;
    },
    onSuccess: () => {
      // ✅ INVALIDAR QUERIES PARA ACTUALIZAR DATOS
      queryClient.invalidateQueries({ queryKey: ['patient', 'charge-orders'] });
      queryClient.invalidateQueries({ queryKey: ['patient', 'charge-order'] });
    },
  });
}