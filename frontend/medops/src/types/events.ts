// src/types/events.ts
// =====================================================
// SEVERIDAD
// =====================================================
export type EventSeverity = "info" | "warning" | "critical";
// =====================================================
// EVENTO DE AUDITORÍA
// =====================================================
export interface Event {
  id: number;
  
  // Institución y usuario
  institution?: number | null;
  actor_user?: number | null;
  actor_name?: string | null;
  
  // Entidad y acción
  entity: string;
  entity_id: number;
  action: string;
  
  // Metadata
  metadata?: Record<string, any>;
  severity: EventSeverity;
  notify: boolean;
  is_read?: boolean;
  
  // Campos enriquecidos del backend
  title?: string;
  description?: string;
  category?: string;
  action_label?: string;
  action_href?: string | null;
  badge_action?: "create" | "update" | "delete" | "other";
  
  // Timestamp
  timestamp: string;
  
  // Display
  created_at?: string;
  updated_at?: string;
}
// =====================================================
// CREATE EVENT INPUT
// =====================================================
export interface CreateEventInput {
  title: string;
  description: string;
  date: string;
}