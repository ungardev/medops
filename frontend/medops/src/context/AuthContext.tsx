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
// Nombres de claves en localStorage
const STORAGE_KEYS = {
  PATIENT_TOKEN: 'patient_access_token',
  DOCTOR_TOKEN: 'authToken',
  USER: 'auth_user',
};
// Canal de broadcast para sincronización entre pestañas
const authChannel = new BroadcastChannel('auth_channel');
// Obtener URL base del backend desde variables de entorno
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
  // Verificar token al montar la app
  const verifyToken = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = tokens.patient_access_token || tokens.authToken;
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
      // Determinar endpoint según tipo de token
      // IMPORTANTE: API_URL ya incluye "/api" en .env
      const endpoint = tokens.patient_access_token 
        ? `${API_URL}/patient/auth/verify/` 
        : `${API_URL}/auth/verify/`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        // Token inválido, limpiar storage
        logout();
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [tokens]);
  // Efecto para verificar token al montar
  useEffect(() => {
    verifyToken();
  }, [verifyToken]);
  // Escuchar cambios de autenticación desde otras pestañas
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
          logout(false); // No retransmitir para evitar loops
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
    // Transmitir a otras pestañas
    authChannel.postMessage({
      type: 'AUTH_CHANGE',
      action: 'LOGIN',
      tokenType: type,
      token,
      user: userData,
    });
  }, []);
  const logout = useCallback((broadcast = true) => {
    // Limpiar storage
    localStorage.removeItem(STORAGE_KEYS.PATIENT_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.DOCTOR_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    // Limpiar estado
    setTokens({ patient_access_token: null, authToken: null });
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    // Transmitir a otras pestañas
    if (broadcast) {
      authChannel.postMessage({
        type: 'AUTH_CHANGE',
        action: 'LOGOUT',
      });
    }
    // Redirigir a login (solo si no estamos ya en una página de login)
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/login')) {
      if (currentPath.includes('/patient')) {
        navigate('/patient/login');
      } else {
        navigate('/login');
      }
    }
  }, [navigate]);
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