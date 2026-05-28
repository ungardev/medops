// src/types/config.ts
// =====================================================
// 🔹 Jerarquía Geográfica "Deep Structure"
// =====================================================
export interface Country { id: number; name: string; }
export interface State { id: number; name: string; country: number; }
export interface Municipality { id: number; name: string; state: number; }
export interface Parish { id: number; name: string; municipality: number; }
export interface Neighborhood {
  id: number;
  name: string;
  parish?: {
    id: number;
    name: string;
    municipality?: {
      id: number;
      name: string;
      state?: {
        id: number;
        name: string;
        country: { id: number; name: string };
      };
    };
  };
}
// =====================================================
// 🔹 Configuración Institucional (Fintech Ready + Geográfica)
// =====================================================
export interface InstitutionSettings {
  id?: number;
  name: string;
  phone: string;
  tax_id: string; // RIF/NIT/Fiscal ID
  logo?: string | File | null;
  // ⚔️ Estructura Geográfica EXPANDIDA
  neighborhood?: number | Neighborhood | null;
  address: string; // Dirección detallada (Calle/Av/Local)
  // 🆕 CAMBIO: Campos geográficos completos para compatibilidad con IdentityInstitution
  country?: string | null;        // 🆕 Nombre del país
  state_name?: string | null;      // 🆕 Nombre del estado
  municipality_name?: string | null; // 🆕 Nombre del municipio
  parish_name?: string | null;     // 🆕 Nombre de la parroquia
  // 💰 Motor Financiero
  active_gateway: 'none' | 'banesco_ve' | 'stripe' | 'binance_pay' | 'paypal';
  is_gateway_test_mode: boolean; // Sandbox vs Production
  // 🆕 CAMBIO: Compatible con null (backend consistency)
  settlement_bank_name?: string | null;    // 🆕 Cambiado a null-compatible
  settlement_account_id?: string | null;   // 🆕 Cambiado a null-compatible
  // Estado del Nodo
  is_active: boolean;
}
// =====================================================
// 🔹 Especialidad Clínica
// =====================================================
export interface Specialty {
  id: number;
  code: string;
  name: string;
}
// =====================================================
// 🔹 Institución Simple (para DoctorConfig)
// =====================================================
export interface InstitutionSimple {
  id: number;
  name: string;
}
// =====================================================
// 🔹 Configuración del Médico Operador (Identity v2.0)
// =====================================================
export interface DoctorConfig {
  id?: number;
  full_name?: string;
  // === MPPS VENEZUELA COMPLIANCE ===
  national_id?: string;
  birthdate?: string;
  birth_country?: string;
  license_expiry_date?: string;
  is_active_license?: boolean;
  license_expiry_status?: 'active' | 'expiring_soon' | 'expired' | 'unknown';
  // ================================
  gender: 'M' | 'F' | 'O';
  // Credenciales
  colegiado_id?: string;
  license?: string;
  is_verified: boolean;
  verification_notes?: string;
  // Alcance
  specialty_ids?: number[];
  specialties?: Specialty[];
  institutions?: number[];
  active_institution?: InstitutionSimple;
  // Contacto & Firma
  email?: string;
  phone?: string;
  signature?: string | File | null;
  specialty?: string | null;
  bio?: string;
  photo_url?: string;
  photo?: string | File | null;
// =====================================================
// 🔹 WhatsApp Business Integration
// =====================================================
  whatsapp_enabled?: boolean;
  whatsapp_business_number?: string;
  whatsapp_business_id?: string;
  whatsapp_access_token?: string;
  whatsapp_webhook_verify_token?: string;
  reminder_hours_before?: number;
// =====================================================
// 🔹 Datos Bancarios (DoctorPaymentConfig)
// =====================================================
  bank_name?: string;
  bank_rif?: string;
  bank_phone?: string;
  bank_account?: string;
}

// =====================================================
// 🔹 Configuración de Pago del Doctor (PaymentConfig)
// =====================================================
export interface DoctorPaymentConfig {
  id?: number;
  bank_name?: string;
  bank_account?: string;
  bank_rif?: string;
  bank_phone?: string;
  bank_account_holder?: string;
  // Binance Crypto
  binance_merchant_id?: string;
  binance_enabled?: boolean;
  binance_crypto_wallet_address?: string;
  binance_network?: string;
  // Payment Methods Flags
  payment_mobile_enabled?: boolean;
  bank_transfer_enabled?: boolean;
  crypto_enabled?: boolean;
  // Configuración general
  account_type?: 'natural' | 'juridica';
  manual_verification_enabled?: boolean;
  notifications_enabled?: boolean;
  // Comisiones
  commission_doctor_percent?: number;
  commission_patient_percent?: number;
  // Verificación
  is_verified?: boolean;
  verified_at?: string;
  verification_notes?: string;
  // Timestamps
  created_at?: string;
  updated_at?: string;
}