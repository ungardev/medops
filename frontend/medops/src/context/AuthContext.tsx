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

  const getPatientToken = useCallback((): string | null => {
    return localStorage.getItem('patient_access_token')
      || localStorage.getItem('patient_drf_token')
      || null;
  }, []);

  const verifyToken = useCallback(async () => {
    setIsLoading(true);
    try {
      const doctorToken = localStorage.getItem(STORAGE_KEYS.DOCTOR_TOKEN);
      const patientToken = getPatientToken();

      // Determine which token to verify based on SUBDOMAIN
      const currentPortal = getCurrentPortal();
      const isPatientPortal = currentPortal === 'patient';

      let token: string | null = null;
      let endpoint: string;

      if (isPatientPortal) {
        // On patient portal, verify patient token (or none)
        token = patientToken;
        endpoint = `${API_URL}/patient/auth/verify/`;
      } else {
        // On doctor portal, verify doctor token (or fallback to patient)
        token = doctorToken || patientToken;
        const isFallback = !doctorToken && !!patientToken;
        endpoint = isFallback
          ? `${API_URL}/patient/auth/verify/`
          : `${API_URL}/auth/verify/`;
      }

      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
          'X-Portal': currentPortal,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);

        setTokens({
          patient_access_token: patientToken,
          authToken: doctorToken,
        });
      } else {
        // Only clear tokens for the current portal on verify failure
        if (isPatientPortal) {
          localStorage.removeItem(STORAGE_KEYS.PATIENT_TOKEN);
          localStorage.removeItem('patient_drf_token');
          localStorage.removeItem('patient_refresh_token');
          localStorage.removeItem('patient_id');
          localStorage.removeItem('patient_name');
        } else {
          // For doctor portal, only clear doctor token if that's what we're verifying
          if (doctorToken) {
            localStorage.removeItem(STORAGE_KEYS.DOCTOR_TOKEN);
          }
          // Don't clear patient tokens - they might be valid for patient portal
        }
        setTokens({ patient_access_token: null, authToken: null });
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
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
        const { action, tokenType, token, user: userData, redirectTo } = event.data;

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
          // Don't clear all tokens on logout broadcast - only the targeted one
          if (event.data.tokenType === 'patient') {
            localStorage.removeItem(STORAGE_KEYS.PATIENT_TOKEN);
            localStorage.removeItem('patient_drf_token');
            localStorage.removeItem('patient_refresh_token');
            localStorage.removeItem('patient_id');
            localStorage.removeItem('patient_name');
            setTokens(prev => ({ ...prev, patient_access_token: null }));
          } else if (event.data.tokenType === 'doctor') {
            localStorage.removeItem(STORAGE_KEYS.DOCTOR_TOKEN);
            setTokens(prev => ({ ...prev, authToken: null }));
          } else {
            // Clear all if tokenType not specified (full logout)
            localStorage.removeItem(STORAGE_KEYS.PATIENT_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.DOCTOR_TOKEN);
            localStorage.removeItem('patient_drf_token');
            localStorage.removeItem('patient_refresh_token');
            localStorage.removeItem('patient_id');
            localStorage.removeItem('patient_name');
            setTokens({ patient_access_token: null, authToken: null });
          }
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
    const currentPortal = getCurrentPortal();
    const isPatientPortal = currentPortal === 'patient';

    // Only clear tokens for the current portal
    if (isPatientPortal) {
      localStorage.removeItem(STORAGE_KEYS.PATIENT_TOKEN);
      localStorage.removeItem('patient_drf_token');
      localStorage.removeItem('patient_refresh_token');
      localStorage.removeItem('patient_id');
      localStorage.removeItem('patient_name');
      setTokens(prev => ({ ...prev, patient_access_token: null }));
    } else {
      localStorage.removeItem(STORAGE_KEYS.DOCTOR_TOKEN);
      // Don't clear patient tokens - they might be needed for patient portal
      setTokens(prev => ({ ...prev, authToken: null }));
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