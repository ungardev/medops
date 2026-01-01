// types/notifications.ts

// Severidad institucional (alineada con el modelo Event)
export type NotificationSeverity = "info" | "warning" | "critical";

// Acción auditada (para NotificationBadge)
export type AuditAction = "create" | "update" | "delete" | "other";

// Contrato enriquecido de notificación
export interface NotificationEvent {
  id: number;
  timestamp: string; // ISO date
  actor?: string; // quién disparó el evento
  entity: string; // Payment, Appointment, WaitingRoom, Dashboard, etc.
  entity_id: number;

  // 🔹 Acción cruda del backend (ej. "patient_arrived")
  action: string;

  // 🔹 Acción normalizada para el badge
  badge_action: AuditAction;

  severity: NotificationSeverity; // nivel de importancia
  notify: boolean;

  // 🔹 Campos enriquecidos desde el serializer
  title: string; // título sintetizado (ej. "Pago confirmado")
  description?: string; // detalle adicional (ej. "Orden #147 confirmada")
  category: string; // clave única (ej. "payment.create")

  // 🔹 Acción navegable
  action_label?: string; // texto del botón (ej. "Ver pago")
  action_href?: string;  // URL navegable (ej. "/payments/147")

  // 🔹 Metadata flexible
  metadata?: Record<string, any>;
}
