// src/types/config.ts
// =====================================================
// 🔹 Jerarquía Geográfica "Deep Structure"
// =====================================================
export interface Country { id: number; name: string; }
export interface State { id: number; name: string; country: number; }
export interface municipality { id: number; name: string; state: number; }
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
  active_gateway: 'none' | 'mercantil_ve' | 'banesco_ve' | 'stripe' | 'binance_pay' | 'paypal';
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
// 🔹 Configuración del Médico Operador (Identity v2.0)
// =====================================================
export interface DoctorConfig {
  id?: number;
  full_name?: string;
  gender: 'M' | 'F' | 'O'; // 👈 Nuevo: Discriminador de título formal
  
  // Credenciales
  colegiado_id?: string;
  license?: string;
  is_verified: boolean; // Estado de validación del colegio
  // Alcance
  specialty_ids?: number[];
  specialties?: Specialty[];
  institutions?: number[]; // IDs de las sedes donde opera
  // Contacto & Firma
  email?: string;
  phone?: string;
  signature?: string | File | null;
  
  // 🆕 AGREGADO: specialty (especialidad principal)
  specialty?: string | null;
  
  // =====================================================
  // 🔹 WhatsApp Business Integration
  // =====================================================
  whatsapp_enabled?: boolean;
  whatsapp_business_number?: string;
  whatsapp_business_id?: string;
  whatsapp_access_token?: string;
  reminder_hours_before?: number;
}