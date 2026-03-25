// Cliente API para el Portal del Paciente
import axios from 'axios';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  PatientDashboard,
  PatientAppointment,
  PatientUser,
  PatientPaymentMethod,
  PatientChargeOrder,
  PatientChargeOrdersResponse,
  RegisterPaymentRequest,
  RegisterPaymentResponse,
} from '@/types/patient';
// ============================================
// INTERFACES DE SERVICIOS Y DOCTORES (NUEVAS)
// ============================================
export interface Doctor {
  id: number;
  full_name: string;
  gender: string;
  is_verified: boolean;
  colegiado_id: string;
  license: string;
  specialties: { id: number; name: string }[];
  institutions: { id: number; name: string }[];
  email: string;
  phone: string;
  services?: DoctorService[];
  bio?: string;        // <--- AGREGADO: Biografía corta del doctor
  photo_url?: string;  // <--- AGREGADO: URL de foto de perfil
}
export interface ServiceCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
}
export interface DoctorService {
  id: number;
  code: string;  // ✅ NUEVO
  doctor: number;
  doctor_name: string;
  category: number;
  category_name: string;
  institution: number;
  institution_name: string;
  name: string;
  description: string;
  price_usd: number;
  duration_minutes: number;
  is_active: boolean;
  is_visible_global: boolean;
  requires_appointment: boolean;
  booking_lead_time: number;
  cancellation_window: number;
}
// ============================================
// INTERFACES DE RESPUESTA DE API
// ============================================
export interface DoctorSearchResponse {
  count: number;
  results: Doctor[];
}
export interface ServiceCatalogResponse {
  count: number;
  results: DoctorService[];
  // Mantener compatibilidad con estructura antigua
  services?: DoctorService[];
  specialties?: string[];
  total_services?: number;
}
// ============================================
// INTERFACES ANTIGUAS (COMPATIBILIDAD)
// ============================================
export interface ServiceHistoryItem {
  code: string;
  description: string;
  qty: number;
  unit_price: number;
  subtotal: number;
}
export interface ServiceHistoryOrder {
  id: number;
  date: string;
  institution: string;
  total: number;
  status: string;
  items: ServiceHistoryItem[];
}
export interface ServiceHistoryResponse {
  orders: ServiceHistoryOrder[];
  summary: {
    total_orders: number;
    total_invertido: number;
    unique_services: number;
  };
}
export interface ServiceCatalogItem {
  code: string;
  description: string;
  average_price: number;
  times_used: number;
  last_used?: string;
}
export interface ServiceCatalogResponseLegacy {
  services: DoctorService[]; // ✅ Cambiar de ServiceCatalogItem[] a DoctorService[]
  specialties: string[];
  total_services: number;
}
export interface RecommendedDoctor {
  id: number;
  full_name: string;
  gender: string;
  specialties: string[];
  is_verified: boolean;
}
export interface RecommendedService {
  id: number;
  code: string;
  name: string;
  doctor_name: string;
  institution_name: string;
  price_usd: number;
  duration_minutes: number;
  times_used: number;
}
export interface ServicesRecommendedResponse {
  recommended_doctors: RecommendedDoctor[];
  recommended_services: RecommendedService[];  // ✅ NUEVO
  based_on: string;
}
// Interfaces para búsqueda (compatibilidad)
export interface DoctorSearchResult {
  id: number;
  full_name: string;
  gender: string;
  specialties: string[];
  institutions: string[];
  license: string;
  is_verified: boolean;
}
// ============================================
// NUEVO: INTERFACES PARA BÚSQUEDA DE SERVICIOS (ACTUALIZADA)
// ============================================
export interface ServiceSearchResult {
  id: number;
  code: string;
  name: string;
  description: string;
  doctor_name: string;
  institution_name: string;
  price_usd: number;
  duration_minutes: number;
  times_used: number;
  is_active: boolean;
  category_name: string;
  doctor: number;
  category: number;
  institution: number;
  is_visible_global: boolean;
  requires_appointment: boolean;
  booking_lead_time: number;
  cancellation_window: number;
}
export interface ServiceSearchResponse {
  count: number;
  results: ServiceSearchResult[];
}
// ============================================
// NUEVO: INTERFACES PARA COMPRAS DIRECTAS (CORREGIDO)
// ============================================
export interface PurchaseServiceRequest {
  patient_id: number;      // CORREGIDO: snake_case
  doctor_service_id: number; // CORREGIDO: snake_case y nombre específico
  institution_id: number;   // NUEVO: ID de la institución
  tentative_date: string;   // NUEVO: Fecha tentativa (YYYY-MM-DD)
  tentative_time: string;   // NUEVO: Hora tentativa (HH:MM)
  qty: number;
}
export interface PurchaseServiceResponse {
  id: number;
  patient: number;
  doctor?: number;
  institution: number;
  total: number;
  balance_due: number;
  status: string;
  issued_at?: string;
  // Campos adicionales según la estructura real del backend
}
// ============================================
// NUEVO: INTERFAZ PARA DISPONIBILIDAD
// ============================================
export interface AvailabilitySlot {
  start: string;
  end: string;
  available: boolean;
}
export interface ServiceAvailabilityResponse {
  service_id: number;
  institution_id: number;
  date: string;
  available_slots: AvailabilitySlot[];
}
// ============================================
// CONFIGURACIÓN DE AXIOS
// ============================================
const API_BASE_URL = '/api';
const patientApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Interceptor para agregar token del paciente
patientApi.interceptors.request.use((config) => {
  let token = localStorage.getItem('patient_drf_token');
  
  if (!token) {
    token = localStorage.getItem('patient_access_token');
  }
  
  if (token && config.headers) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});
// ============================================
// AUTH ENDPOINTS
// ============================================
export const patientAuth = {
  login: (data: LoginRequest) =>
    patientApi.post<LoginResponse>('/patient-auth/login/', data),
  
  register: (data: RegisterRequest) =>
    patientApi.post<RegisterResponse>('/patient-auth/register/', data),
  
  logout: () =>
    patientApi.post('/patient-auth/logout/'),
};
// ============================================
// PATIENT CLIENT ENDPOINTS (EXISTENTES)
// ============================================
export const patientClient = {
  // Dashboard y Perfil
  getDashboard: () =>
    patientApi.get<PatientDashboard>('/patient-dashboard/'),
  
  getProfile: () =>
    patientApi.get<{ patient: any; user: any }>('/patient-profile/'),
  
  updateProfile: (data: Partial<PatientUser>) =>
    patientApi.put('/patient-profile/', data),
  
  // Citas
  getAppointments: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return patientApi.get<{ appointments: PatientAppointment[] }>(
      `/patient-appointments/${params}`
    );
  },
  
  // === MÉTODOS DE PAGO ===
  getPaymentMethod: () =>
    patientApi.get<PatientPaymentMethod>('/patient-payment-method/'),
  
  updatePaymentMethod: (data: Partial<PatientPaymentMethod>) =>
    patientApi.put<PatientPaymentMethod>('/patient-payment-method/', data),
    
  // Órdenes de Cobro
  getChargeOrders: () =>
    patientApi.get<PatientChargeOrdersResponse>('/patient-charge-orders/'),
  
  getChargeOrderDetail: (orderId: number) =>
    patientApi.get<PatientChargeOrder>(`/patient-charge-orders/${orderId}/`),
  
  // === REGISTRO DE PAGO CON SOPORTE PARA SCREENSHOT ===
  registerPayment: async (orderId: number, data: RegisterPaymentRequest) => {
    if (data.screenshot) {
      const formData = new FormData();
      formData.append('bank_code', data.bank_code);
      formData.append('phone', data.phone);
      formData.append('national_id', data.national_id);
      formData.append('reference', data.reference);
      formData.append('amount_bs', String(data.amount_bs));
      formData.append('screenshot', data.screenshot);
      
      return patientApi.post<RegisterPaymentResponse>(
        `/patient-charge-orders/${orderId}/register-payment/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    }
    
    return patientApi.post<RegisterPaymentResponse>(
      `/patient-charge-orders/${orderId}/register-payment/`,
      data
    );
  },
  
  // === SERVICIOS (Historial y Catálogo) ===
  getServicesHistory: () =>
    patientApi.get<ServiceHistoryResponse>('/patient/services/history/'),
  
  getServicesCatalog: () =>
    patientApi.get<ServiceCatalogResponseLegacy>('/patient/services/catalog/'),
  
  getServicesRecommended: () =>
    patientApi.get<ServicesRecommendedResponse>('/patient/services/recommended/'),
  
  // === BÚSQUEDA ===
  searchDoctors: (query: string) =>
    patientApi.get<DoctorSearchResponse>(
      `/patient-search/doctors/?q=${encodeURIComponent(query)}`
    ),
  
  searchServices: (query: string) =>
    patientApi.get<ServiceSearchResponse>(
      `/patient-search/services/?q=${encodeURIComponent(query)}`
    ),
  // === DISPONIBILIDAD DE SERVICIOS ===
  getAvailability: (serviceId: number, institutionId: number, date: string) =>
    patientApi.get<ServiceAvailabilityResponse>(
      `/patient/services/${serviceId}/availability/?institution_id=${institutionId}&date=${date}`
    ),
};
// ============================================
// NUEVOS CLIENTES PARA FASE 2 (DOCTORES Y SERVICIOS)
// ============================================
export const doctorClient = {
  // Obtener directorio de doctores (listado)
  getDoctors: (params?: { specialty?: number; institution?: number }) => {
    const queryString = params 
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return patientApi.get<DoctorSearchResponse>(`/patient/doctors/${queryString}`);
  },
  // Obtener perfil de un doctor específico
  getDoctorProfile: (doctorId: number) => {
    return patientApi.get<Doctor>(`/patient/doctor-profile/${doctorId}/`);
  },
  // Obtener servicios de un doctor específico
  getDoctorServices: (doctorId: number) => {
    return patientApi.get<DoctorService[]>(
      `/patient/doctor-profile/${doctorId}/services/`
    );
  },
};
export const serviceClient = {
  // Obtener catálogo global de servicios (con info del doctor)
  getServices: (params?: { category?: number; doctor?: number }) => {
    const queryString = params 
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return patientApi.get<ServiceCatalogResponse>(`/patient/services/${queryString}`);
  },
  // Obtener categorías de servicios
  getCategories: () => {
    return patientApi.get<ServiceCategory[]>('/patient/service-categories/');
  },
};
// ============================================
// NUEVO: CLIENTE PARA OPERACIONES DE COBRO DIRECTO (CORREGIDO)
// ============================================
export const chargeClient = {
  purchaseServiceDirect: (data: PurchaseServiceRequest) => {
    // Envía los datos en snake_case como espera el backend
    return patientApi.post<PurchaseServiceResponse>('/charges/purchase-service/', data);
  }
};
export default patientApi;