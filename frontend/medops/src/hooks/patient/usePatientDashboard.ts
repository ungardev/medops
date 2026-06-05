// src/hooks/patient/usePatientDashboard.ts
import { useQuery } from '@tanstack/react-query';
import { patientClient } from '@/api/patient/client';
import type { PatientDashboard as PatientDashboardType } from '@/types/patient';

export function usePatientDashboard() {
  return useQuery<PatientDashboardType>({
    queryKey: ['patient', 'dashboard'],
    queryFn: async () => {
      const response = await patientClient.getDashboard();
      return response.data;
    },
    staleTime: 2 * 60 * 1000,    // 2 minutes - dashboard data refreshes moderately
    gcTime: 60 * 60 * 1000,      // 1 hour garbage collection
    refetchOnWindowFocus: false,  // Don't refetch on tab switch
    retry: 1,
  });
}