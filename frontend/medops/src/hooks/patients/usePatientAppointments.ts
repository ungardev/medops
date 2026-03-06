// src/hooks/patients/usePatientAppointments.ts
import { useQuery } from "@tanstack/react-query";
import { getCompletedAppointmentsByPatient, getPendingAppointmentsByPatient } from "@/api/appointments";
import { Appointment } from "@/types/appointments";
interface PatientAppointmentsResult {
  list: Appointment[];
  pending: Appointment[];
  completed: Appointment[];
  totalCount: number;
}
export function usePatientAppointments(patientId: number) {
  const { data: completedData, isLoading: isLoadingCompleted } = useQuery<Appointment[]>({
    queryKey: ["patientAppointments", "completed", patientId],
    queryFn: () => getCompletedAppointmentsByPatient(patientId),
    enabled: !!patientId,
  });
  const { data: pendingData, isLoading: isLoadingPending } = useQuery<Appointment[]>({
    queryKey: ["patientAppointments", "pending", patientId],
    queryFn: () => getPendingAppointmentsByPatient(patientId),
    enabled: !!patientId,
  });
  const isLoading = isLoadingCompleted || isLoadingPending;
  
  const completed: Appointment[] = completedData ?? [];
  const pending: Appointment[] = pendingData ?? [];
  const list: Appointment[] = [...pending, ...completed].sort((a, b) => 
    new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
  );
  return {
    data: { list, pending, completed, totalCount: list.length },
    isLoading,
    error: null,
  };
}