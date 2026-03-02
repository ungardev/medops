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
// Interceptor para agregar token
patientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('patient_access_token');
  if (token && config.headers) {
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