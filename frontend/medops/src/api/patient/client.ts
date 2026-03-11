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
// INTERFACES DE SERVICIOS
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
export interface ServiceCatalogResponse {
  services: ServiceCatalogItem[];
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
export interface ServicesRecommendedResponse {
  recommended_doctors: RecommendedDoctor[];
  based_on: string;
}
export interface DoctorSearchResult {
  id: number;
  full_name: string;
  gender: string;
  specialties: string[];
  institutions: string[];
  license: string;
  is_verified: boolean;
}
export interface DoctorSearchResponse {
  count: number;
  results: DoctorSearchResult[];
}
export interface ServiceSearchResult {
  code: string;
  description: string;
  times_used: number;
}
export interface ServiceSearchResponse {
  count: number;
  results: ServiceSearchResult[];
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
  // ✅ PRIMERO: Buscar DRF Token (para compatibilidad con activación)
  let token = localStorage.getItem('patient_drf_token');
  
  // ✅ SEGUNDO: Si no hay DRF Token, usar PatientSession Token
  if (!token) {
    token = localStorage.getItem('patient_access_token');
  }
  
  if (token && config.headers) {
    // ✅ Usar Bearer token para PatientSession
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
// PATIENT CLIENT ENDPOINTS
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
    // Si hay screenshot, usar FormData
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
    
    // Sinon, JSON normal
    return patientApi.post<RegisterPaymentResponse>(
      `/patient-charge-orders/${orderId}/register-payment/`,
      data
    );
  },
  // === SERVICIOS (Historial y Catálogo) ===
  getServicesHistory: () =>
    patientApi.get<ServiceHistoryResponse>('/patient/services/history/'),
  
  getServicesCatalog: () =>
    patientApi.get<ServiceCatalogResponse>('/patient/services/catalog/'),
  
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
};
export default patientApi;