// src/types/payments.ts
// =====================================================
// IMPORTAR TIPOS DE IDENTIDAD DESDE identity.ts
// =====================================================
import type { IdentityPatient, IdentityDoctor, IdentityInstitution } from "./identity";
// =====================================================
// ENUMS - Alineados con backend
// =====================================================
export enum PaymentStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  REJECTED = "rejected",
  VOID = "void",
}
export enum PaymentMethod {
  CASH = "cash",
  CARD = "card",
  TRANSFER = "transfer",
  ZELLE = "zelle",
  CRYPTO = "crypto",
  OTHER = "other",
  P2C_MERCANTIL = "p2c_mercantil",  // 🆕 NUEVO MÉTODO DE PAGO P2C
}
export enum ChargeOrderStatus {
  OPEN = "open",
  PARTIALLY_PAID = "partially_paid",
  PAID = "paid",
  VOID = "void",
  WAIVED = "waived",
}
// =====================================================
// ÍTEM DE COBRO
// =====================================================
export interface ChargeItem {
  id: number;
  order: number;
  code: string;
  description?: string | null;
  qty: number;
  unit_price: number;
  subtotal: number;
}
// =====================================================
// PAGO
// =====================================================
export interface Payment {
  id: number;
  
  // Relaciones
  institution: IdentityInstitution;
  appointment: number;
  charge_order: number;
  doctor: IdentityDoctor;
  
  // Transacción
  amount: number | string;
  currency: string;
  method: PaymentMethod;
  method_display?: string;
  status: PaymentStatus;
  status_display?: string;
  
  // Trazabilidad Fintech
  gateway_transaction_id?: string | null;
  reference_number?: string | null;
  bank_name?: string | null;
  detail?: string | null;
  gateway_response_raw?: Record<string, any>;
  
  // Auditoría
  received_by?: number | null;
  received_at?: string | null;
  cleared_at?: string | null;
  idempotency_key?: string | null;
  
  // Display
  patient_name?: string;
  
  // 🆕 AGREGADO: appointment_date (alias de compatibilidad)
  appointment_date?: string;
  
  // 🆕 AGREGADO: patient (alias de compatibilidad)
  patient?: IdentityPatient;
}
// =====================================================
// PAGO EXTENDIDO (para UI)
// =====================================================
export interface PaymentExtended extends Payment {
  appointment_date?: string;
}
// =====================================================
// DATOS DE ENTRADA PARA CREAR/EDITAR PAGO
// =====================================================
export interface PaymentInput {
  amount: string;
  method: PaymentMethod;
  status?: PaymentStatus;
  reference_number?: string;
  bank_name?: string;
  detail?: string;
  charge_order: number;
  appointment?: number;
}
// =====================================================
// ORDEN DE COBRO
// =====================================================
export interface ChargeOrder {
  id: number;
  
  // Relaciones
  appointment: number;
  patient: number;
  patient_name?: string;
  patient_detail?: IdentityPatient;
  institution: IdentityInstitution;
  doctor: IdentityDoctor;
  
  // Monetización
  currency: string;
  total: number;
  balance_due: number;
  status: ChargeOrderStatus;
  status_display?: string;
  
  // Items y pagos
  items: ChargeItem[];
  payments: any[];
  
  // Auditoría
  issued_at: string;
  issued_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  
  // Alias para pagos
  appointment_date?: string;
  total_amount?: string | number;
}
// =====================================================
// 🆕 TIPOS P2C MERCANTIL - INTERFACES ESPECÍFICAS
// =====================================================
// 🆕 Estados de transacción P2C
export type P2CTransactionStatus = 
  | 'generated'
  | 'pending'
  | 'confirmed'
  | 'expired'
  | 'cancelled'
  | 'failed';
// 🆕 Transacción P2C completa
export interface MercantilP2CTransaction {
  id: number;
  
  // Relaciones
  institution: IdentityInstitution;
  charge_order?: number | null;
  payment?: number | null;
  
  // Datos de transacción
  merchant_order_id: string;
  mercantil_transaction_id?: string | null;
  amount: number;
  currency: string;
  
  // Datos QR
  qr_code_data?: string | null;
  qr_image_url?: string | null;
  
  // Estado y tiempos
  status: P2CTransactionStatus;
  status_display?: string;
  expires_at?: string | null;
  confirmed_at?: string | null;
  
  // Datos de respuesta del gateway
  gateway_response_raw?: Record<string, any>;
  callback_data?: Record<string, any>;
  
  // Auditoría
  created_at: string;
  updated_at: string;
}
// 🆕 Solicitud de generación QR P2C
export interface P2CPaymentRequest {
  institution_id: number;
  amount: number;
  charge_order_id?: number;
}
// 🆕 Respuesta de generación QR P2C
export interface P2CPaymentResponse {
  success: boolean;
  
  // Datos exitosos
  transaction_id?: number;
  merchant_order_id?: string;
  qr_code_data?: string;
  qr_image_url?: string;
  expires_at?: string;
  amount?: string;
  currency?: string;
  status?: string;
  
  // Datos de error
  error?: string;
  error_code?: string;
  details?: string;
  
  // Metadatos
  note?: string;
  placeholder_mode?: boolean;
  
  // Transacción completa (opcional)
  transaction?: MercantilP2CTransaction;
}
// 🆕 Datos de WebSocket para actualizaciones P2C
export interface P2CWebSocketUpdate {
  type: 'p2c_status_update';
  data: {
    merchant_order_id: string;
    status: P2CTransactionStatus;
    amount?: string;
    confirmed_at?: string;
    mercantil_transaction_id?: string;
    gateway_response?: Record<string, any>;
  };
}
// 🆕 Configuración P2C por institución
export interface MercantilP2CConfig {
  id: number;
  institution: IdentityInstitution;
  
  // Credenciales
  client_id?: string | null;
  secret_key?: string | null;
  webhook_secret?: string | null;
  
  // Configuración
  is_test_mode: boolean;
  qr_expiration_minutes: number;
  min_amount: number;
  max_amount: number;
  
  // URLs
  webhook_url?: string | null;
  
  // Auditoría
  created_at: string;
  updated_at: string;
}
// 🆕 Payload para creación de pago P2C (extiende PaymentInput)
export interface P2CPaymentInput extends PaymentInput {
  merchant_order_id: string;
  qr_code_data?: string;
  mercantil_transaction_id?: string;
}
// =====================================================
// 🆕 TIPOS DE COMPONENTES P2C - PARA FRONTEND
// =====================================================
// 🆕 Props para componente P2C Payment
export interface MercantilP2CPaymentProps {
  institutionId: number;
  amount: number;
  chargeOrderId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}
// 🆕 Estado de transacción P2C para UI
export interface P2CTransactionUI {
  id: number;
  merchant_order_id: string;
  amount: number;
  currency: string;
  qr_code_data?: string;
  status: P2CTransactionStatus;
  expires_at?: string;
  timeRemaining?: number;
  isLoading?: boolean;
  isSuccess?: boolean;
  isExpired?: boolean;
  isPending?: boolean;
  error?: string;
}
// =====================================================
// 🆕 EXTENSIONES DE TIPOS EXISTENTES
// =====================================================
// 🆕 Extender PaymentInput para incluir P2C
export type ExtendedPaymentInput = PaymentInput & {
  merchant_order_id?: string;
  qr_code_data?: string;
};
// 🆕 Extender ChargeOrder para incluir transacciones P2C
export interface ChargeOrderWithP2C extends ChargeOrder {
  p2c_transactions?: MercantilP2CTransaction[];
  has_pending_p2c?: boolean;
}
// =====================================================
// CONSTANTES Y UTILIDADES P2C
// =====================================================
// 🆕 Constantes útiles para P2C
export const P2C_CONSTANTS = {
  DEFAULT_EXPIRATION_MINUTES: 15,
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 1000000,
  CURRENCY: 'VES',
  WEBSOCKET_ENDPOINT: '/ws/payments/',
  PLACEHOLDER_QR_DATA: 'PLACEHOLDER_UNTIL_CREDENTIALS',
} as const;
// 🆕 Valores por defecto para configuración P2C
export const DEFAULT_P2C_CONFIG: Partial<MercantilP2CConfig> = {
  is_test_mode: true,
  qr_expiration_minutes: P2C_CONSTANTS.DEFAULT_EXPIRATION_MINUTES,
  min_amount: P2C_CONSTANTS.MIN_AMOUNT,
  max_amount: P2C_CONSTANTS.MAX_AMOUNT,
};