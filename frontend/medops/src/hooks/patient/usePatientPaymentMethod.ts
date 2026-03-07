import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientClient } from '@/api/patient/client';
import { PatientPaymentMethod } from '@/types/patient';
export function usePatientPaymentMethod() {
  return useQuery({
    queryKey: ['patient', 'payment-method'],
    queryFn: async () => {
      const response = await patientClient.getPaymentMethod();
      return response.data;
    },
  });
}
export function useUpdatePatientPaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<PatientPaymentMethod>) => {
      const response = await patientClient.updatePaymentMethod(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', 'payment-method'] });
    },
  });
}