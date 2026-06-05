// src/hooks/patient/useInvalidatePatient.ts
import { useQueryClient } from '@tanstack/react-query';

export function useInvalidatePatient() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: ['patient', 'dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['patient', 'profile'] });
    queryClient.invalidateQueries({ queryKey: ['patient', 'appointments'] });
    queryClient.invalidateQueries({ queryKey: ['patient', 'charge-orders'] });
    queryClient.invalidateQueries({ queryKey: ['patient', 'services'] });
  };
}