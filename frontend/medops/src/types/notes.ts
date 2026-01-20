// src/types/notes.ts
// =====================================================
// NOTA CLÍNICA (SOAP)
// =====================================================
export interface ClinicalNote {
  id: number;
  appointment: number;
  
  // Componentes SOAP
  subjective?: string | null;
  objective?: string | null;
  analysis?: string | null;
  plan?: string | null;
  
  // Estado de bloqueo
  is_locked: boolean;
  locked_at?: string | null;
  
  // Propiedad para UI
  is_editable?: boolean;
  
  // Auditoría
  created_at?: string;
  updated_at?: string;
}