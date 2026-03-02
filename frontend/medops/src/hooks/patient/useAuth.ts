// Hook de autenticación para el Portal del Paciente
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientAuth, patientClient } from '@/api/patient/client';
interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  patient: any;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  error: string | null;
}
export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [patient, setPatient] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('patient_access_token');
    if (!token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }
    try {
      const response = await patientClient.getDashboard();
      setPatient(response.data.patient);
      setIsAuthenticated(true);
    } catch (err) {
      localStorage.removeItem('patient_access_token');
      localStorage.removeItem('patient_refresh_token');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await patientAuth.login({ email, password });
      
      localStorage.setItem('patient_access_token', response.data.access_token);
      localStorage.setItem('patient_refresh_token', response.data.refresh_token);
      
      setPatient(response.data.patient);
      setIsAuthenticated(true);
      
      navigate('/patient/dashboard');
      return true;
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al iniciar sesión';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  const logout = async () => {
    try {
      await patientAuth.logout();
    } catch (err) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('patient_access_token');
      localStorage.removeItem('patient_refresh_token');
      setIsAuthenticated(false);
      setPatient(null);
      navigate('/patient/login');
    }
  };
  return {
    isAuthenticated,
    isLoading,
    patient,
    login,
    logout,
    error,
  };
}