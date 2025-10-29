// src/hooks/useCompletedAppointments.ts
import { useQuery } from "@tanstack/react-query";
import { getCompletedAppointmentsByPatient } from "../../api/appointments";
import { Appointment } from "../../types/appointments";

export function useCompletedAppointments(patientId: number) {
  return useQuery<Appointment[]>({
    queryKey: ["completedAppointments", patientId],
    queryFn: () => getCompletedAppointmentsByPatient(patientId),
    enabled: !!patientId,
  });
}
