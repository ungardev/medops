// src/types/dashboard.ts
// =====================================================
// TENDENCIAS
// =====================================================
export type TrendPoint = { date: string; value: number };
// =====================================================
// ✅ NUEVO: Dashboard de Institución Activa
// =====================================================
export interface ActiveInstitutionDashboard {
  institution: import("./config").InstitutionSettings;
  metrics: {
    patients_today: number;
    appointments_today: number;
    payments_today: number;
    pending_payments: number;
  };
}
// =====================================================
// RESUMEN DEL DASHBOARD
// =====================================================
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
  total_canceled_orders: number;        // ✅ solo órdenes anuladas en el rango
  // 🔹 Tendencias
  appointments_trend: TrendPoint[];
  payments_trend: TrendPoint[];
  balance_trend: TrendPoint[];
  // 🔹 Trazabilidad institucional
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
// =====================================================
// NOTIFICATIONS - IMPORTADO DESDE notifications.ts
// =====================================================
// ❌ NotificationSeverity eliminado - usar el de notifications.ts
// ❌ NotificationEvent eliminado - usar el de notifications.ts
// =====================================================
// ACCIÓN DE NOTIFICACIÓN
// =====================================================
export interface NotificationAction {
  href: string;
  label: string;
}
// =====================================================
// ENTIDADES POSIBLES EN NOTIFICACIONES
// =====================================================
export type NotificationEntity = "Appointment" | "Payment" | "WaitingRoom" | "Dashboard";
// =====================================================
// EVENTO DE AUDITORÍA
// =====================================================
export interface EventLogEntry {
  id: number;
  timestamp: string;   // ISO datetime
  actor: string;       // médico/usuario que realizó la acción
  entity: string;
  action: string;
  severity?: any;      // Importar desde notifications.ts: NotificationSeverity
  notify?: boolean;    // si debe notificar
  metadata?: Record<string, any> | null;  // contexto adicional
}
// =====================================================
// RESUMEN DE CITAS PARA DASHBOARD (RENOMBRADO)
// =====================================================
// ✅ Renombrado de AppointmentSummary a DashboardAppointmentSummary
// para evitar conflicto con AppointmentSummary de patients.ts
export interface DashboardAppointmentSummary {
  id: number;
  appointment_date: string;
  patient: { full_name: string };
}
// =====================================================
// RESUMEN DE PAGOS
// =====================================================
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