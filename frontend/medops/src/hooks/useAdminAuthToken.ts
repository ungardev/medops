// src/hooks/useAdminAuthToken.ts
import { useAdminAuth as useAdminAuthContext } from '@/context/AdminAuthContext';
import { useCallback } from 'react';

export function useAdminAuthToken() {
  const {
    tokens,
    login: contextLogin,
    logout: contextLogout,
    isAuthenticated,
    user
  } = useAdminAuthContext();

  const token = tokens.access;

  const saveToken = useCallback((newAccessToken: string, newRefreshToken: string, userData: any) => {
    contextLogin({ access: newAccessToken, refresh: newRefreshToken }, userData);
  }, [contextLogin]);

  const clearToken = useCallback(() => {
    contextLogout();
  }, [contextLogout]);

  return { token, saveToken, clearToken, isAuthenticated, user };
}
