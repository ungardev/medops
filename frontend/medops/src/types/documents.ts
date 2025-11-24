// src/types/documents.ts
export interface MedicalDocument {
  id: number;
  description: string | null;
  category: string | null;
  audit_code?: string;          // 👈 añadido para auditoría
  uploaded_at: string;          // ISO date string
  uploaded_by: string | null;
  file_url: string | null;      // 👈 clave homogénea del backend
  appointment_id?: number | null;
  source?: string | null;
  origin_panel?: string | null;
  is_signed?: boolean;
  mime_type?: string | null;
  size_bytes?: number | null;
}
