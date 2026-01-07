// --- Tendencias ---
export type TrendPoint = { date: string; value: number };

export type DashboardSummary = {
  // 🔹 Pacientes y citas
  total_patients: number;
  total_appointments: number;
  active_appointments: number;          // ✅ citas con actividad clínica real
  completed_appointments: number;       // ✅ status=completed en rango
  pending_appointments: number;         // ✅ status=pending en rango
  active_consultations: number;         // ✅ status=in_consultation en rango
  canceled_appointments: number;        // ✅ status=canceled en rango
  arrived_appointments: number;         // ✅ status=arrived en rango

  // 🔹 Estado clínico en tiempo real
  waiting_room_count: number;           // pacientes en sala de espera

  // 🔹 Pagos y finanzas
  total_payments: number;               // número de pagos confirmados
  total_payments_amount: number;        // monto total facturado
  total_waived: number;                 // número de exoneraciones
  estimated_waived_amount: number;      // monto estimado exonerado
  financial_balance: number;            // balance acumulado

  // 🔹 Eventos críticos
  total_events: number;                 // eventos críticos genéricos (auditoría)
  total_canceled_orders: number;        // ✅ nuevo: solo órdenes anuladas en el rango

  // 🔹 Tendencias
  appointments_trend: TrendPoint[];
  payments_trend: TrendPoint[];
  balance_trend: TrendPoint[];

  // 🔹 Nuevo: trazabilidad institucional
  event_log?: EventLogEntry[];

  // 🔹 Tasa BCV aplicada (solo si currency = VES)
  bcv_rate?: {
    value: number;
    unit: string;
    precision: number;
    is_fallback: boolean;
  };

  // 🔹 Alias para métricas compactas (usadas en MetricsRow.tsx)
  scheduled_count?: number;       // alias de total_appointments o citas agendadas
  pending_count?: number;         // alias de pending_appointments
  waiting_count?: number;         // alias de waiting_room_count
  in_consultation_count?: number; // alias de active_consultations
  completed_count?: number;       // alias de completed_appointments
  total_amount?: number;          // alias de total_payments_amount
  payments_count?: number;        // alias de total_payments
  exempted_count?: number;        // alias de total_waived
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
  entity: NotificationEntity;
  entity_id: number;
  message: string;
  metadata?: Record<string, any> | null;
  severity?: NotificationSeverity | null;
  notify?: boolean;
  action?: NotificationAction;
}

// --- Evento de auditoría extendido ---
export interface EventLogEntry {
  id: number;
  timestamp: string;   // ISO datetime
  actor: string;       // ✅ corregido: antes era 'user'
  entity: string;
  action: string;
  severity?: NotificationSeverity | null;   // 🔹 nivel de criticidad
  notify?: boolean;                         // 🔹 si debe notificar
  metadata?: Record<string, any> | null;    // 🔹 contexto adicional
}

// --- Resumen de citas ---
export interface AppointmentSummary {
  id: number;
  appointment_date: string;
  patient: { full_name: string };
}

// --- Resumen de pagos ---
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
