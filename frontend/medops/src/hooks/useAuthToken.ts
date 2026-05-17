// src/hooks/useAuthToken.ts
import { useAuth as useAuthContext } from '@/context/AuthContext';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuthToken() {
  const { 
    tokens, 
    login: contextLogin, 
    logout: contextLogout,
    isAuthenticated,
    user 
  } = useAuthContext();
  const navigate = useNavigate();

  const token = tokens.access;

  const saveToken = useCallback((newAccessToken: string, newRefreshToken?: string) => {
    contextLogin('doctor', { access: newAccessToken, refresh: newRefreshToken || null }, user || undefined);
    localStorage.setItem('doctor_access_token', newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem('doctor_refresh_token', newRefreshToken);
    }
  }, [contextLogin, user]);

  const clearToken = useCallback(() => {
    contextLogout();
    localStorage.removeItem('doctor_access_token');
    localStorage.removeItem('doctor_refresh_token');
    navigate('/login');
  }, [contextLogout, navigate]);

  return { token, saveToken, clearToken, isAuthenticated, user };
}