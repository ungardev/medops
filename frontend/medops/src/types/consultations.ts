// src/types/consultations.ts

// Representa una nota clínica asociada a un paciente
export interface ConsultationNote {
  id: number;
  patient_id: number;
  content: string;
  created_at: string;   // ISO timestamp
  updated_at: string;   // ISO timestamp
  author?: string;      // opcional: médico/usuario que escribió la nota
}
