// src/hooks/patient/usePatientAuth.ts
import { useAuth as useAuthContext } from '@/context/AuthContext';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { queryClient } from '@/lib/reactQuery';
import { getPatient, setPatientCache } from '@/hooks/patients/usePatient';
import type { PatientClinicalProfile } from '@/types/patients';

const PATIENT_CACHE_KEY = 'medops_patient_cache';

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
      
      contextLogin('patient', data.token, {
        id: data.patient.id,
        username: data.patient.full_name || '',
        email: data.patient.email || email,
        is_staff: false,
        is_superuser: false,
      });

      if (data.patient?.id) {
        const patientId = data.patient.id;

        try {
          const patientData = await getPatient(patientId);
          queryClient.setQueryData(["patient", patientId], patientData);
          setPatientCache(patientData);
        } catch (err) {
          console.error('[PatientAuth] Failed to cache patient data:', err);
        }
      }
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }, [contextLogin, navigate]);

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
      const patientId = localStorage.getItem('patient_id');
      
      localStorage.removeItem('patient_access_token');
      localStorage.removeItem('patient_refresh_token');
      localStorage.removeItem('patient_drf_token');
      localStorage.removeItem('patient_id');
      localStorage.removeItem('patient_name');
      
      if (patientId) {
        localStorage.removeItem(`${PATIENT_CACHE_KEY}_${patientId}`);
      }
      
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