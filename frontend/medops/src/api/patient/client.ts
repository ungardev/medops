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
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// Auth endpoints
export const patientAuth = {
  login: (data: LoginRequest) =>
    patientApi.post<LoginResponse>('/patient-auth/login/', data),
  
  register: (data: RegisterRequest) =>
    patientApi.post<RegisterResponse>('/patient-auth/register/', data),
  
  logout: () =>
    patientApi.post('/patient-auth/logout/'),
};
// Patient endpoints
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
  registerPayment: (orderId: number, data: RegisterPaymentRequest) =>
    patientApi.post<RegisterPaymentResponse>(
      `/patient-charge-orders/${orderId}/register-payment/`,
      data
    ),
};
export default patientApi;