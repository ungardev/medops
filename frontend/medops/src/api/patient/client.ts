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
  getDashboard: () =>
    patientApi.get<PatientDashboard>('/patient-dashboard/'),
  
  getProfile: () =>
    patientApi.get<{ patient: any; user: any }>('/patient-profile/'),
  
  updateProfile: (data: Partial<PatientUser>) =>
    patientApi.put('/patient-profile/', data),
  getAppointments: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return patientApi.get<{ appointments: PatientAppointment[] }>(
      `/patient-appointments/${params}`
    );
  },
};
export default patientApi;