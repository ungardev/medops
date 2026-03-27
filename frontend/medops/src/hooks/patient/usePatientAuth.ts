// src/hooks/patient/usePatientAuth.ts
import { useAuth as useAuthContext } from '@/context/AuthContext';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
export function usePatientAuth() {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    tokens, 
    login: contextLogin, 
    logout: contextLogout,
    verifyToken 
  } = useAuthContext();
  const navigate = useNavigate();
  // Login para paciente
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      
      const response = await fetch(`${API_URL}/patient/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al iniciar sesión");
      }
      const data = await response.json();
      
      // Guardar TODOS los tokens en localStorage
      if (data.access_token) {
        localStorage.setItem('patient_access_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('patient_refresh_token', data.refresh_token);
      }
      if (data.token) {
        localStorage.setItem('patient_drf_token', data.token);
      }
      if (data.patient?.id) {
        localStorage.setItem('patient_id', String(data.patient.id));
      }
      if (data.patient?.full_name) {
        localStorage.setItem('patient_name', data.patient.full_name);
      }
      
      // ✅ CORRECCIÓN CRÍTICA: Usar data.token (DRF token) en lugar de data.access_token (PatientSession token)
      // El endpoint verify_patient_token acepta DRF token, NO PatientSession token
      contextLogin('patient', data.token, {
        id: data.patient.id,
        username: data.patient.full_name || '',
        email: data.patient.email || email,
        is_staff: false,
        is_superuser: false,
      });
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }, [contextLogin, navigate]);
  // Logout para paciente
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('patient_access_token') || localStorage.getItem('patient_drf_token');
      if (token) {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
        await fetch(`${API_URL}/patient/auth/logout/`, {
          method: "POST",
          headers: { 
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json"
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Limpiar TODOS los tokens de paciente
      localStorage.removeItem('patient_access_token');
      localStorage.removeItem('patient_refresh_token');
      localStorage.removeItem('patient_drf_token');
      localStorage.removeItem('patient_id');
      localStorage.removeItem('patient_name');
      
      contextLogout();
    }
  }, [contextLogout]);
  return {
    isAuthenticated,
    isLoading,
    patient: user,
    login,
    logout,
    error: null,
    verifyToken,
  };
}