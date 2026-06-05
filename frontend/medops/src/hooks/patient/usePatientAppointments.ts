// src/hooks/patient/usePatientAppointments.ts
import { useQuery } from '@tanstack/react-query';
import { getAppointmentsByPatient } from '@/api/appointments';
import type { Appointment } from '@/types/appointments';

export function usePatientAppointments(patientId: number) {
  return useQuery<Appointment[]>({
    queryKey: ['patient', 'appointments', patientId],
    queryFn: () => getAppointmentsByPatient(patientId),
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,    // 2 minutes
    gcTime: 60 * 60 * 1000,      // 1 hour
    refetchOnWindowFocus: false,
    retry: 1,
  });
}