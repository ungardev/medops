// src/types/documents.ts
export interface MedicalDocument {
  id: number;
  description: string | null;
  category: string | null;
  uploaded_at: string;   // ISO date string
  uploaded_by: string | null;
  file: string;          // URL al archivo
}
