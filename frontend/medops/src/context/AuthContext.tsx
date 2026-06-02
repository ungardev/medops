// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPortal, isPatientSubdomain, getPortalConfig } from '@/lib/subdomain';

interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  full_name?: string;
}

interface Tokens {
  access: string | null;
  refresh: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: Tokens;
  login: (type: 'patient' | 'doctor', tokens: Tokens, user?: User) => void;
  logout: () => void;
  verifyToken: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  DOCTOR_ACCESS: 'doctor_access_token',
  DOCTOR_REFRESH: 'doctor_refresh_token',
  PATIENT_TOKEN: 'patient_access_token',
  USER: 'auth_user',
};

const authChannel = new BroadcastChannel('auth_channel');

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens>({
    access: localStorage.getItem(STORAGE_KEYS.DOCTOR_ACCESS),
    refresh: localStorage.getItem(STORAGE_KEYS.DOCTOR_REFRESH),
  });

  const getPatientToken = useCallback((): string | null => {
    return localStorage.getItem('patient_access_token')
      || localStorage.getItem('patient_drf_token')
      || null;
  }, []);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const currentRefresh = localStorage.getItem(STORAGE_KEYS.DOCTOR_REFRESH);
    if (!currentRefresh) {
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: currentRefresh }),
      });

      if (response.ok) {
        const data = await response.json();
        const newAccess = data.access;
        localStorage.setItem(STORAGE_KEYS.DOCTOR_ACCESS, newAccess);
        setTokens(prev => ({ ...prev, access: newAccess }));
        return newAccess;
      } else {
        localStorage.removeItem(STORAGE_KEYS.DOCTOR_ACCESS);
        localStorage.removeItem(STORAGE_KEYS.DOCTOR_REFRESH);
        setTokens({ access: null, refresh: null });
        return null;
      }
    } catch {
      return null;
    }
  }, []);

  const verifyToken = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentPortal = getCurrentPortal();
      const isPatientPortal = currentPortal === 'patient';

      if (isPatientPortal) {
        const patientToken = getPatientToken();
        if (!patientToken) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/patient/auth/verify/`, {
          headers: {
            'Authorization': `Token ${patientToken}`,
            'Content-Type': 'application/json',
            'X-Portal': currentPortal,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsAuthenticated(true);
          setTokens({ access: null, refresh: null });
        } else {
          localStorage.removeItem(STORAGE_KEYS.PATIENT_TOKEN);
          setTokens({ access: null, refresh: null });
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        const doctorAccess = localStorage.getItem(STORAGE_KEYS.DOCTOR_ACCESS);
        const doctorRefresh = localStorage.getItem(STORAGE_KEYS.DOCTOR_REFRESH);

        if (!doctorAccess && !doctorRefresh) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        if (doctorRefresh) {
          const response = await fetch(`${API_URL}/auth/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: doctorRefresh }),
          });

          if (response.ok) {
            const data = await response.json();
            const newAccess = data.access;
            localStorage.setItem(STORAGE_KEYS.DOCTOR_ACCESS, newAccess);
            
            const userData = localStorage.getItem(STORAGE_KEYS.USER);
            setUser(userData ? JSON.parse(userData) : null);
            setIsAuthenticated(true);
            setTokens({ access: newAccess, refresh: doctorRefresh });
          } else {
            localStorage.removeItem(STORAGE_KEYS.DOCTOR_ACCESS);
            localStorage.removeItem(STORAGE_KEYS.DOCTOR_REFRESH);
            setTokens({ access: null, refresh: null });
            setUser(null);
            setIsAuthenticated(false);
          }
        } else if (doctorAccess) {
          localStorage.removeItem(STORAGE_KEYS.DOCTOR_ACCESS);
          setTokens({ access: null, refresh: null });
          setIsAuthenticated(false);
        }
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [getPatientToken, refreshAccessToken]);

  useEffect(() => {
    verifyToken();
  }, []);

  // Auto-refresh access token cada 50 minutos (1 min antes de expiry si eran 60min)
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.DOCTOR_REFRESH);
      if (refreshToken) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          console.log('[AuthContext] Auto-refresh successful');
        }
      }
    }, 50 * 60 * 1000); // 50 minutos

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleAuthChange = (event: MessageEvent) => {
      if (event.data.type === 'AUTH_CHANGE') {
        const { action, tokenType, tokens: newTokens, user: userData } = event.data;

        if (action === 'LOGIN') {
          if (tokenType === 'doctor' && newTokens) {
            setTokens({ access: newTokens.access, refresh: newTokens.refresh });
            localStorage.setItem(STORAGE_KEYS.DOCTOR_ACCESS, newTokens.access);
            if (newTokens.refresh) {
              localStorage.setItem(STORAGE_KEYS.DOCTOR_REFRESH, newTokens.refresh);
            }
          } else if (tokenType === 'patient') {
            setTokens({ access: null, refresh: null });
            localStorage.setItem(STORAGE_KEYS.PATIENT_TOKEN, newTokens.access);
          }
          if (userData) {
            setUser(userData);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
          }
          setIsAuthenticated(true);
        } else if (action === 'LOGOUT') {
          if (event.data.tokenType === 'patient') {
            localStorage.removeItem(STORAGE_KEYS.PATIENT_TOKEN);
            localStorage.removeItem('patient_drf_token');
            localStorage.removeItem('patient_refresh_token');
            setTokens({ access: null, refresh: null });
          } else if (event.data.tokenType === 'doctor') {
            localStorage.removeItem(STORAGE_KEYS.DOCTOR_ACCESS);
            localStorage.removeItem(STORAGE_KEYS.DOCTOR_REFRESH);
            setTokens({ access: null, refresh: null });
          } else {
            localStorage.removeItem(STORAGE_KEYS.DOCTOR_ACCESS);
            localStorage.removeItem(STORAGE_KEYS.DOCTOR_REFRESH);
            localStorage.removeItem(STORAGE_KEYS.PATIENT_TOKEN);
            localStorage.removeItem('patient_drf_token');
            localStorage.removeItem('patient_refresh_token');
            setTokens({ access: null, refresh: null });
          }
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

    authChannel.addEventListener('message', handleAuthChange);
    return () => authChannel.removeEventListener('message', handleAuthChange);
  }, []);

  const login = useCallback((type: 'patient' | 'doctor', newTokens: Tokens, userData?: User) => {
    if (type === 'doctor') {
      setTokens({ access: newTokens.access, refresh: newTokens.refresh });
      localStorage.setItem(STORAGE_KEYS.DOCTOR_ACCESS, newTokens.access || '');
      if (newTokens.refresh) {
        localStorage.setItem(STORAGE_KEYS.DOCTOR_REFRESH, newTokens.refresh);
      }
    } else {
      setTokens({ access: null, refresh: null });
      localStorage.setItem(STORAGE_KEYS.PATIENT_TOKEN, newTokens.access || '');
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
      tokens: newTokens,
      user: userData,
    });
  }, []);

  const logout = useCallback((broadcast = true) => {
    const currentPortal = getCurrentPortal();
    const isPatientPortal = currentPortal === 'patient';

    if (isPatientPortal) {
      localStorage.removeItem(STORAGE_KEYS.PATIENT_TOKEN);
      localStorage.removeItem('patient_drf_token');
      localStorage.removeItem('patient_refresh_token');
      setTokens({ access: null, refresh: null });
    } else {
      localStorage.removeItem(STORAGE_KEYS.DOCTOR_ACCESS);
      localStorage.removeItem(STORAGE_KEYS.DOCTOR_REFRESH);
      setTokens({ access: null, refresh: null });
    }

    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);

    if (broadcast) {
      authChannel.postMessage({
        type: 'AUTH_CHANGE',
        action: 'LOGOUT',
        tokenType: isPatientPortal ? 'patient' : 'doctor',
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
        refreshAccessToken,
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