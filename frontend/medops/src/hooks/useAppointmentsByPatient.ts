// src/hooks/useAppointmentsByPatient.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/client";

export interface Prescription {
  id: number;
  medication: string;
  dosage?: string;
  duration?: string;
}

export interface Treatment {
  id: number;
  plan: string;
  start_date?: string;
  end_date?: string;
}

export interface Diagnosis {
  id: number;
  code: string;
  description?: string;
  treatments: Treatment[];
  prescriptions: Prescription[];
}

export interface Appointment {
  id: number;
  appointment_date: string;
  appointment_type: string;
  status: string;
  notes?: string;
  expected_amount: string;
  diagnoses: Diagnosis[];
}

async function fetchAppointmentsByPatient(patientId: number): Promise<Appointment[]> {
  return apiFetch(`appointments/?patient_id=${patientId}`);
}

export function useAppointmentsByPatient(patientId: number) {
  return useQuery<Appointment[]>({
    queryKey: ["appointments", patientId],
    queryFn: () => fetchAppointmentsByPatient(patientId),
    enabled: !!patientId,
  });
}
