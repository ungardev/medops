// Tipos para el Portal del Paciente
export interface PatientUser {
  id: number;
  email: string;
  patient: Patient;
  is_active: boolean;
  is_verified: boolean;
  two_factor_enabled: boolean;
  phone?: string;
  phone_verified: boolean;
  id_verified: boolean;
  notifications_email: boolean;
  notifications_sms: boolean;
  notifications_whatsapp: boolean;
  last_login_at?: string;
}
export interface Patient {
  id: number;
  full_name: string;
  national_id?: string;
  email?: string;
  phone_number?: string;
  birthdate?: string;
  age?: number;
  age_category?: string;
  is_pediatric: boolean;
  is_minor: boolean;
  gender?: string;
  address?: string;
  guardian_info?: GuardianInfo;
}
export interface GuardianInfo {
  name: string;
  relationship: string;
  phone?: string;
  email?: string;
  consent_date?: string;
  consent_given: boolean;
}
export interface PatientSubscription {
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'pending' | 'suspended' | 'cancelled' | 'expired';
  monthly_price_usd: number;
  monthly_price_ves: number;
  start_date: string;
  end_date?: string;
  days_remaining?: number;
  auto_renew: boolean;
}
export interface PatientAppointment {
  id: number;
  date: string;
  time?: string;
  status: 'pending' | 'arrived' | 'in_consultation' | 'completed' | 'canceled';
  doctor?: {
    id: number;
    name: string;
  };
  institution?: {
    name: string;
  };
  reason?: string;
  notes?: string;
}
export interface PatientDashboard {
  patient: {
    id: number;
    full_name: string;
    email: string;
    phone?: string;
    national_id?: string;    // ✅ AGREGADO
    birthdate?: string;      // ✅ AGREGADO
    is_pediatric: boolean;
    age?: number;
    is_verified: boolean;
    address?: string;
  };
  subscription?: {
    plan: string;
    status: string;
    days_remaining?: number;
  };
  upcoming_appointments: PatientAppointment[];
  past_appointments_count: number;
  notifications: {
    unread_count: number;
  };
}
// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  token: string;
  patient: {
    id: number;
    full_name: string;
    email: string;
    is_verified: boolean;
    two_factor_enabled: boolean;
  };
  expires_at: string;
}
export interface RegisterRequest {
  email: string;
  password: string;
  patient_id: number;
}
export interface RegisterResponse {
  success: boolean;
  message: string;
  patient_user_id: number;
  email: string;
}


// ============================================
// TIPOS DE PAGOS - PORTAL PACIENTE
// ============================================
export interface PatientPaymentMethod {
  id: number;
  mobile_phone: string;
  mobile_national_id: string;
  preferred_bank: string;
  bank_name: string | null;
  last_payment_amount: number | null;
  crypto_wallet: string;
  crypto_type: string;
  created_at: string;
  updated_at: string;
}


export interface PatientChargeOrderSummary {
  id: number;
  institution: string;
  institution_tax_id: string;
  total: number;
  balance_due: number;
  status: 'open' | 'partially_paid' | 'paid' | 'void' | 'waived';
  status_display: string;
  issued_at: string;
  items_count: number;
  payments_count: number;
}


export interface ChargeOrderItem {
  id: number;
  code: string;
  description: string;
  qty: number;
  unit_price: number;
  subtotal: number;
}


export interface PatientPayment {
  id: number;
  amount: number;
  method: string;
  status: string;
  reference_number: string | null;
  received_at: string | null;
}


export interface PatientChargeOrder {
  id: number;
  institution: {
    id: number;
    name: string;
    tax_id: string;
    address?: string;
  };
  doctor: {
    id: number;
    name: string;
  } | null;
  appointment: {
    id: number;
    date: string;
    time: string;
  } | null;
  currency: string;
  total: number;
  balance_due: number;
  min_amount_bs: number;
  bcv_rate: number;
  status: 'open' | 'partially_paid' | 'paid' | 'void' | 'waived';
  status_display: string;
  issued_at: string;
  items: ChargeOrderItem[];
  payments: PatientPayment[];
}


export interface PatientChargeOrdersResponse {
  orders: PatientChargeOrderSummary[];
  summary: {
    total_orders: number;
    total_pending: number;
    total_paid: number;
    paid_orders: number;
    pending_orders: number;
  };
}


export interface RegisterPaymentRequest {
  bank_code: string;
  phone: string;
  national_id: string;
  reference: string;
  amount_bs: number;
}


export interface RegisterPaymentResponse {
  success: boolean;
  payment: {
    id: number;
    amount: number;
    amount_bs: number;
    reference: string;
    status: string;
    verification_type: 'automatic' | 'manual';
    message: string;
  };
}