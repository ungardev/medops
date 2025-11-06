export type TrendPoint = { date: string; value: number };

export type DashboardSummary = {
  total_patients: number;
  total_appointments: number;
  completed_appointments: number;
  pending_appointments: number;
  total_payments: number;
  total_events: number;
  total_waived: number;
  total_payments_amount: number;
  estimated_waived_amount: number;
  financial_balance: number;
  appointments_trend: TrendPoint[];
  payments_trend: TrendPoint[];
  balance_trend: TrendPoint[];
};

export type NotificationEvent = {
  id: number;
  timestamp: string;
  actor?: string | null;
  entity: string;
  entity_id: number;
  message: string;
  metadata?: Record<string, any> | null;
  severity?: "info" | "warning" | "critical" | "success" | null;
  notify?: boolean;

  // 👇 añadimos soporte para acciones rápidas
  action?: {
    href: string;
    label: string;
  };
};

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
