// src/components/Auth/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthGuard } from "hooks/useAuthGuard";
import { ReactNode } from "react";
interface ProtectedRouteProps {
  allowedRoles?: ('doctor' | 'patient' | 'admin')[];
  children?: ReactNode;
}
export function ProtectedRoute({ allowedRoles = ['doctor', 'admin'], children }: ProtectedRouteProps) {
  const { checking } = useAuthGuard();
  
  // ============================================================
  // ✅ FIX: Usar token correcto según la ruta
  // Si es ruta de paciente, usar patient_access_token
  // Si es ruta de doctor, usar authToken
  // ============================================================
  const isPatientRoute = window.location.pathname.startsWith('/patient');
  const token = isPatientRoute 
    ? localStorage.getItem('patient_access_token') 
    : localStorage.getItem('authToken');
  
  if (checking) {
    return <p>Verificando sesión...</p>;
  }
  
  // Si no hay token, redirigir según el contexto
  if (!token) {
    return isPatientRoute 
      ? <Navigate to="/patient/login" replace />
      : <Navigate to="/login" replace />;
  }
  
  // Verificar rol del usuario
  const userRole = localStorage.getItem('userRole') || (isPatientRoute ? 'patient' : 'doctor');
  
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