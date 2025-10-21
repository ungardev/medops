export interface Appointment {
  id: number;
  patient: string;   // o Patient si quieres relacionar
  doctor: string;
  date: string;      // ISO string
  status: string;    // ej: "scheduled" | "completed" | "cancelled"
}

export interface AppointmentInput {
  patient: string;
  doctor: string;
  date: string;
  status: string;
}
