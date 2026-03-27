// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
}
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: {
    patient_access_token: string | null;
    authToken: string | null;
  };
  login: (type: 'patient' | 'doctor', token: string, user?: User) => void;
  logout: () => void;
  verifyToken: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEYS = {
  PATIENT_TOKEN: 'patient_access_token',
  DOCTOR_TOKEN: 'authToken',
  USER: 'auth_user',
};
const authChannel = new BroadcastChannel('auth_channel');
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState({
    patient_access_token: localStorage.getItem(STORAGE_KEYS.PATIENT_TOKEN),
    authToken: localStorage.getItem(STORAGE_KEYS.DOCTOR_TOKEN),
  });
  // Función auxiliar para obtener el token de paciente (con fallback a DRF token)
  const getPatientToken = useCallback((): string | null => {
    return localStorage.getItem('patient_access_token') 
      || localStorage.getItem('patient_drf_token') 
      || null;
  }, []);
  // Verificar token al montar la app
  const verifyToken = useCallback(async () => {
    setIsLoading(true);
    try {
      // Obtener token de doctor o paciente
      const doctorToken = localStorage.getItem(STORAGE_KEYS.DOCTOR_TOKEN);
      const patientToken = getPatientToken();
      
      const token = doctorToken || patientToken;
      
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      const isPatient = !doctorToken && !!patientToken;
      const endpoint = isPatient 
        ? `${API_URL}/patient/auth/verify/` 
        : `${API_URL}/auth/verify/`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Actualizar tokens en estado
        setTokens({
          patient_access_token: patientToken,
          authToken: doctorToken,
        });
      } else {
        // Token inválido, limpiar todo
        localStorage.removeItem(STORAGE_KEYS.PATIENT_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.DOCTOR_TOKEN);
        localStorage.removeItem('patient_drf_token');
        localStorage.removeItem('patient_refresh_token');
        localStorage.removeItem('patient_id');
        localStorage.removeItem('patient_name');
        setTokens({ patient_access_token: null, authToken: null });
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [getPatientToken]);
  useEffect(() => {
    verifyToken();
  }, []);
  useEffect(() => {
    const handleAuthChange = (event: MessageEvent) => {
      if (event.data.type === 'AUTH_CHANGE') {
        const { action, tokenType, token, user: userData } = event.data;
        
        if (action === 'LOGIN') {
          if (tokenType === 'patient') {
            setTokens(prev => ({ ...prev, patient_access_token: token }));
            localStorage.setItem(STORAGE_KEYS.PATIENT_TOKEN, token);
          } else {
            setTokens(prev => ({ ...prev, authToken: token }));
            localStorage.setItem(STORAGE_KEYS.DOCTOR_TOKEN, token);
          }
          if (userData) {
            setUser(userData);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
          }
          setIsAuthenticated(true);
        } else if (action === 'LOGOUT') {
          setTokens({ patient_access_token: null, authToken: null });
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };
    authChannel.addEventListener('message', handleAuthChange);
    return () => authChannel.removeEventListener('message', handleAuthChange);
  }, []);
  const login = useCallback((type: 'patient' | 'doctor', token: string, userData?: User) => {
    if (type === 'patient') {
      setTokens(prev => ({ ...prev, patient_access_token: token }));
      localStorage.setItem(STORAGE_KEYS.PATIENT_TOKEN, token);
    } else {
      setTokens(prev => ({ ...prev, authToken: token }));
      localStorage.setItem(STORAGE_KEYS.DOCTOR_TOKEN, token);
    }
    if (userData) {
      setUser(userData);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    }
    setIsAuthenticated(true);
    setIsLoading(false);
    authChannel.postMessage({
      type: 'AUTH_CHANGE',
      action: 'LOGIN',
      tokenType: type,
      token,
      user: userData,
    });
  }, []);
  const logout = useCallback((broadcast = true) => {
    // Limpiar TODOS los tokens
    localStorage.removeItem(STORAGE_KEYS.PATIENT_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.DOCTOR_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem('patient_drf_token');
    localStorage.removeItem('patient_refresh_token');
    localStorage.removeItem('patient_id');
    localStorage.removeItem('patient_name');
    setTokens({ patient_access_token: null, authToken: null });
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    if (broadcast) {
      authChannel.postMessage({
        type: 'AUTH_CHANGE',
        action: 'LOGOUT',
      });
    }
  }, []);
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        tokens,
        login,
        logout,
        verifyToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
export default AuthContext;