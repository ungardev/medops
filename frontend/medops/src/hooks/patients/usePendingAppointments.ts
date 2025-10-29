// src/hooks/usePendingAppointments.ts
import { useQuery } from "@tanstack/react-query";
import { getPendingAppointmentsByPatient } from "../../api/appointments";
import { Appointment } from "../../types/appointments";

export function usePendingAppointments(patientId: number) {
  return useQuery<Appointment[]>({
    queryKey: ["pendingAppointments", patientId],
    queryFn: () => getPendingAppointmentsByPatient(patientId),
    enabled: !!patientId,
  });
}
