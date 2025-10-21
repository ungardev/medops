export interface WaivedConsultation {
  id: number;
  patientId: number;
  reason: string;
  date: string; // ISO string
}

export interface WaivedConsultationInput {
  patientId: number;
  reason: string;
  date: string;
}
