export interface PatientRef {
  id: number;
  name: string;
}

export interface Appointment {
  id: number;
  patient: PatientRef;          // 🔹 ahora es un objeto con id y name
  appointment_date: string;     // YYYY-MM-DD
  appointment_type: string;     // "general" | "specialized"
  expected_amount: string;      // monto esperado
  status: string;               // "pending" | "arrived" | "in_consultation" | "completed" | "canceled"
}

export interface AppointmentInput {
  patient: number;              // al crear cita, se envía solo el id del paciente
  appointment_date: string;
  appointment_type: string;
  expected_amount?: string;
  status?: string;
}
