// src/context/AdminAuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
}

interface Tokens {
  access: string | null;
  refresh: string | null;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: Tokens;
  login: (tokens: Tokens, user: User) => void;
  logout: () => void;
  verifyToken: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ADMIN_ACCESS: 'admin_access_token',
  ADMIN_REFRESH: 'admin_refresh_token',
  ADMIN_USER: 'admin_user',
};

const authChannel = new BroadcastChannel('admin_auth_channel');

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<Tokens>({
    access: localStorage.getItem(STORAGE_KEYS.ADMIN_ACCESS),
    refresh: localStorage.getItem(STORAGE_KEYS.ADMIN_REFRESH),
  });

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const currentRefresh = localStorage.getItem(STORAGE_KEYS.ADMIN_REFRESH);
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
        localStorage.setItem(STORAGE_KEYS.ADMIN_ACCESS, newAccess);
        setTokens(prev => ({ ...prev, access: newAccess }));
        return newAccess;
      } else {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_ACCESS);
        localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH);
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
      const adminAccess = localStorage.getItem(STORAGE_KEYS.ADMIN_ACCESS);
      const adminRefresh = localStorage.getItem(STORAGE_KEYS.ADMIN_REFRESH);
      const adminUser = localStorage.getItem(STORAGE_KEYS.ADMIN_USER);

      if (!adminAccess && !adminRefresh) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      if (adminRefresh) {
        const response = await fetch(`${API_URL}/auth/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: adminRefresh }),
        });

        if (response.ok) {
          const data = await response.json();
          const newAccess = data.access;
          localStorage.setItem(STORAGE_KEYS.ADMIN_ACCESS, newAccess);
          
          setUser(adminUser ? JSON.parse(adminUser) : null);
          setIsAuthenticated(true);
          setTokens({ access: newAccess, refresh: adminRefresh });
        } else {
          localStorage.removeItem(STORAGE_KEYS.ADMIN_ACCESS);
          localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH);
          localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
          setTokens({ access: null, refresh: null });
          setUser(null);
          setIsAuthenticated(false);
        }
      } else if (adminAccess) {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_ACCESS);
        setTokens({ access: null, refresh: null });
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  useEffect(() => {
    const handleAuthChange = (event: MessageEvent) => {
      if (event.data.type === 'ADMIN_AUTH_CHANGE') {
        const { action, tokens: newTokens, user: userData } = event.data;

        if (action === 'ADMIN_LOGIN') {
          if (newTokens) {
            setTokens({ access: newTokens.access, refresh: newTokens.refresh });
            localStorage.setItem(STORAGE_KEYS.ADMIN_ACCESS, newTokens.access || '');
            if (newTokens.refresh) {
              localStorage.setItem(STORAGE_KEYS.ADMIN_REFRESH, newTokens.refresh);
            }
          }
          if (userData) {
            setUser(userData);
            localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(userData));
          }
          setIsAuthenticated(true);
          setIsLoading(false);
        } else if (action === 'ADMIN_LOGOUT') {
          localStorage.removeItem(STORAGE_KEYS.ADMIN_ACCESS);
          localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH);
          localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
          setTokens({ access: null, refresh: null });
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    authChannel.addEventListener('message', handleAuthChange);
    return () => authChannel.removeEventListener('message', handleAuthChange);
  }, []);

  const login = useCallback((newTokens: Tokens, userData: User) => {
    setTokens({ access: newTokens.access, refresh: newTokens.refresh });
    localStorage.setItem(STORAGE_KEYS.ADMIN_ACCESS, newTokens.access || '');
    if (newTokens.refresh) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_REFRESH, newTokens.refresh);
    }
    setUser(userData);
    localStorage.setItem(STORAGE_KEYS.ADMIN_USER, JSON.stringify(userData));
    setIsAuthenticated(true);
    setIsLoading(false);
    authChannel.postMessage({
      type: 'ADMIN_AUTH_CHANGE',
      action: 'ADMIN_LOGIN',
      tokens: newTokens,
      user: userData,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_ACCESS);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_REFRESH);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_USER);
    setTokens({ access: null, refresh: null });
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    authChannel.postMessage({
      type: 'ADMIN_AUTH_CHANGE',
      action: 'ADMIN_LOGOUT',
    });
    navigate('/admin/login');
  }, [navigate]);

  return (
    <AdminAuthContext.Provider
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
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth debe usarse dentro de AdminAuthProvider');
  }
  return context;
};

export default AdminAuthContext;
