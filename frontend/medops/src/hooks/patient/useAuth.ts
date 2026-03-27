// src/hooks/patient/useAuth.ts
import { useAuth as useAuthContext } from '@/context/AuthContext';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
export function useAuth() {
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
  // Login para paciente (compatibilidad con PatientLogin.tsx)
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const rawRoot = import.meta.env.VITE_API_URL || "/api";
      const apiRoot = rawRoot.replace(/\/+$/, "");
      const url = `${apiRoot}/patient/auth/login/`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al iniciar sesión");
      }
      const data = await response.json();
      
      // Usar el contexto para guardar el token y usuario
      contextLogin('patient', data.access_token, data.user);
      
      // Guardar en localStorage para compatibilidad (el contexto ya lo hace)
      localStorage.setItem('patient_access_token', data.access_token);
      if (data.user) {
        localStorage.setItem('patient_id', String(data.user.id));
        localStorage.setItem('patient_name', data.user.full_name || '');
      }
      
      navigate('/patient');
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }, [contextLogin, navigate]);
  // Logout para paciente
  const logout = useCallback(async () => {
    try {
      // Llamada al backend de logout si es necesario
      const token = tokens.patient_access_token;
      if (token) {
        const rawRoot = import.meta.env.VITE_API_URL || "/api";
        const apiRoot = rawRoot.replace(/\/+$/, "");
        await fetch(`${apiRoot}/patient/auth/logout/`, {
          method: "POST",
          headers: { "Authorization": `Token ${token}` },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      contextLogout();
      localStorage.removeItem('patient_id');
      localStorage.removeItem('patient_name');
    }
  }, [tokens.patient_access_token, contextLogout]);
  return {
    isAuthenticated,
    isLoading,
    patient: user, // Para compatibilidad con PatientRecord.tsx
    login,
    logout,
    error: null, // El contexto maneja errores internamente
    verifyToken,
  };
}