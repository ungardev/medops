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
  // Token para Doctor Portal (compatibilidad)
  const token = tokens.authToken;
  // Guardar token (para Doctor Login)
  const saveToken = useCallback((newToken: string) => {
    contextLogin('doctor', newToken, user || undefined);
    localStorage.setItem('authToken', newToken);
  }, [contextLogin, user]);
  // Limpiar token y redirigir
  const clearToken = useCallback(() => {
    contextLogout();
    localStorage.removeItem('authToken');
    navigate('/login');
  }, [contextLogout, navigate]);
  // Sincronizar entre pestañas (ya lo hace el contexto, pero mantenemos compatibilidad)
  // El contexto ya usa BroadcastChannel
  return { token, saveToken, clearToken, isAuthenticated, user };
}