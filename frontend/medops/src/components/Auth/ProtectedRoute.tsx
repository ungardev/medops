// src/components/Auth/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthGuard } from "hooks/useAuthGuard";
import { useAuthToken } from "hooks/useAuthToken";
import { ReactNode } from "react";
interface ProtectedRouteProps {
  allowedRoles?: ('doctor' | 'patient' | 'admin')[];
  children?: ReactNode;
}
export function ProtectedRoute({ allowedRoles = ['doctor', 'admin'], children }: ProtectedRouteProps) {
  const { checking } = useAuthGuard();
  const { token } = useAuthToken();
  if (checking) {
    return <p>Verificando sesión...</p>;
  }
  // Si no hay token, redirigir según el contexto
  if (!token) {
    const isPatientRoute = window.location.pathname.startsWith('/patient');
    return isPatientRoute 
      ? <Navigate to="/patient/login" replace />
      : <Navigate to="/login" replace />;
  }
  // Verificar rol del usuario
  const userRole = localStorage.getItem('userRole') || 'doctor';
  
  // Si hay restricciones de rol, verificar
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole as any)) {
    if (userRole === 'patient') {
      return <Navigate to="/patient" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  // Si hay children, retornarlos; si no, usar Outlet
  return children ? <>{children}</> : <Outlet />;
}