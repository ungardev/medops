export type TrendPoint = { date: string; value: number };

export type DashboardSummary = {
  // 🔹 Pacientes y citas
  total_patients: number;
  total_appointments: number;
  completed_appointments: number;
  pending_appointments: number;

  // 🔹 Estado clínico en tiempo real
  waiting_room_count?: number;     // pacientes en sala de espera
  active_consultations?: number;   // pacientes actualmente en consulta

  // 🔹 Pagos y finanzas
  total_payments: number;              // número de pagos confirmados
  total_payments_amount: number;       // monto total facturado
  total_waived: number;                // número de exoneraciones
  estimated_waived_amount: number;     // monto estimado exonerado
  financial_balance: number;           // balance acumulado
  total_events: number;                // anulaciones / eventos críticos

  // 🔹 Tendencias
  appointments_trend: TrendPoint[];
  payments_trend: TrendPoint[];
  balance_trend: TrendPoint[];

  // 🔹 Nuevo: trazabilidad institucional
  event_log?: EventLogEntry[];
};

// --- Severidad de notificación ---
export type NotificationSeverity = "info" | "warning" | "critical" | "success";

// --- Entidades posibles en notificaciones ---
export type NotificationEntity = "Appointment" | "Payment" | "WaitingRoom" | "Dashboard";

// --- Acción asociada a la notificación ---
export interface NotificationAction {
  href: string;
  label: string;
}

// --- Evento de notificación ---
export interface NotificationEvent {
  id: number;
  timestamp: string; // ISO datetime
  actor?: string | null;
  entity: NotificationEntity; // 👈 tipado explícito
  entity_id: number;          // 👈 siempre número
  message: string;
  metadata?: Record<string, any> | null;
  severity?: NotificationSeverity | null;
  notify?: boolean;
  action?: NotificationAction;
}

export interface EventLogEntry {
  id: number;
  entity: string;
  action: string;
  user: string;
  timestamp: string;
}

export interface AppointmentSummary {
  id: number;
  appointment_date: string;
  patient: { full_name: string };
}

export interface PaymentSummary {
  id: number;
  appointment: number;
  appointment_date: string;
  patient: {
    id: number;
    full_name: string;
    national_id: string;
    email: string;
    age: number;
    allergies: string;
    gender: string;
  };
  charge_order: number;
  amount: string;
  currency: string;
  method: string;
  status: "confirmed" | "pending" | "rejected";
  reference_number: string | null;
  bank_name: string | null;
  received_by: string | null;
  received_at: string | null;
  idempotency_key: string | null;
}
