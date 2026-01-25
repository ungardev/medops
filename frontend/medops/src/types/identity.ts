// src/types/identity.ts
// =====================================================
// TIPOS DE IDENTIDAD CACHED DEL BACKEND
// =====================================================
import { InstitutionSettings } from "./config";
export interface IdentityPatient {
  id: number;
  national_id: string | null;
  full_name: string;
  gender: "M" | "F" | "O" | "Unknown";
}
export interface IdentityDoctor {
  id: number;
  full_name: string;
  colegiado_id: string | null;
  gender: "M" | "F" | "O" | "Unknown";
  is_verified: boolean;
  // ✅ CAMPOS AGREGADOS PARA FINANZAS
  specialty?: string;
  license?: string;
  signature?: string | File | null;
  email?: string;
  phone?: string;
}
// ✅ TIPO UNIFICADO PARA INSTITUCIONES - SIN DUPLICADOS
export interface IdentityInstitution {
  id: number;
  name: string;
  tax_id: string;
  is_active: boolean;
  
  // 🆕 CAMPOS QUE NECESITA InstitutionSettings
  logo?: string | File | null;
  address?: string; // Dirección completa
  phone?: string; // Teléfono
  
  // 🆕 MOTOR FINANCIERO
  active_gateway: 'none' | 'mercantil_ve' | 'banesco_ve' | 'stripe' | 'binance_pay' | 'paypal';
  is_gateway_test_mode: boolean;
  settlement_bank_name?: string;
  settlement_account_id?: string;
  
  // 🆕 ESTRUCTURA GEOGRÁFICA
  neighborhood?: number | null;
  country?: string; // Nombre del país
  state_name?: string | null;
  municipality_name?: string | null;
  parish_name?: string | null;
}
// ✅ FUNCIÓNES PARA DETECTAR TIPO DE INSTITUCIÓN
export function isInstitutionSettings(obj: any): obj is InstitutionSettings {
  return obj && 
    'active_gateway' in obj &&
    'is_gateway_test_mode' in obj;
}
export function isInstitutionIdentity(obj: any): obj is IdentityInstitution {
  return obj && 
    !('active_gateway' in obj) &&
    !('is_gateway_test_mode' in obj);
}
// ✅ FUNCIÓN PARA CREAR OBJETOS VÁLIDOS SI ES NECESARIO
export function createInstitutionSettings(obj: Partial<InstitutionSettings>): InstitutionSettings {
  return {
    id: obj.id || 0,
    name: obj.name || "N/A",
    tax_id: obj.tax_id || "N/A",
    phone: obj.phone || "",
    logo: obj.logo || null,
    neighborhood: obj.neighborhood || null,
    address: obj.address || "",
    // 🆕 CAMPOS GEOGRÁFICOS - ahora disponibles
    country: obj.country || null,
    state_name: obj.state_name || null,
    municipality_name: obj.municipality_name || null,
    parish_name: obj.parish_name || null,
    active_gateway: obj.active_gateway || 'none',
    is_gateway_test_mode: obj.is_gateway_test_mode ?? false,
    // 🆕 FINANZAS - ahora compatible con null
    settlement_bank_name: obj.settlement_bank_name || null,
    settlement_account_id: obj.settlement_account_id || null,
    is_active: obj.is_active ?? true,
  };
}
// ✅ FUNCIÓN PARA CONVERTIR DESDE IdentityInstitution A InstitutionSettings
export function convertToInstitutionSettings(obj: IdentityInstitution | number | null): InstitutionSettings {
  if (typeof obj === 'number') {
    return createInstitutionSettings({
      id: obj,
      name: `Institution ${obj}`,
      tax_id: 'N/A',
      phone: "",
      is_active: true,
    });
  }
  
  if (!obj) {
    return createInstitutionSettings({
      id: 0,
      name: "Unknown",
      tax_id: "N/A",
      phone: "",
      is_active: true,
    });
  }
  
  return createInstitutionSettings({
    id: obj.id,
    name: obj.name,
    tax_id: obj.tax_id,
    is_active: obj.is_active,
    logo: obj.logo,
    address: obj.address,
    phone: obj.phone,
    // 🆕 CAMPOS GEOGRÁFICOS - conversión completa
    country: obj.country || null,
    state_name: obj.state_name || null,
    municipality_name: obj.municipality_name || null,
    parish_name: obj.parish_name || null,
    neighborhood: obj.neighborhood || null,
    active_gateway: obj.active_gateway || 'none',
    is_gateway_test_mode: obj.is_gateway_test_mode,
    // 🆕 FINANZAS - conversión directa
    settlement_bank_name: obj.settlement_bank_name || null,
    settlement_account_id: obj.settlement_account_id || null,
  });
}

