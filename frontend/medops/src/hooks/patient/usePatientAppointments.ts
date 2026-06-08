// src/hooks/patient/usePatientAppointments.ts
import { useQuery } from '@tanstack/react-query';
import { getAppointmentsByPatient } from '@/api/appointments';
import { usePatient } from '@/context/PatientContext';
import type { Appointment } from '@/types/appointments';

export function usePatientAppointments() {
  const { activePatientId } = usePatient();
  
  return useQuery<Appointment[]>({
    queryKey: ['patient', 'appointments', activePatientId],
    queryFn: () => getAppointmentsByPatient(activePatientId || 0),
    enabled: !!activePatientId,
    staleTime: 2 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}