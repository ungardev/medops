// src/components/Auth/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { ReactNode } from "react";
interface ProtectedRouteProps {
  allowedRoles?: ('doctor' | 'patient' | 'admin')[];
  children?: ReactNode;
}
export function ProtectedRoute({ allowedRoles = ['doctor', 'admin'], children }: ProtectedRouteProps) {
  // ✅ CORREGIDO: Detectar rutas de paciente EXACTAS
  // IMPORTANTE: /patients (doctor) NO debe coincidir con /patient (paciente)
  const path = window.location.pathname;
  const isPatientRoute = path === '/patient' || path.startsWith('/patient/');
  
  // ✅ SEPARACIÓN DE TOKENS:
  // - Doctor Portal: usa 'authToken'
  // - Patient Portal: usa 'patient_access_token'
  const token = isPatientRoute 
    ? localStorage.getItem('patient_access_token') 
    : localStorage.getItem('authToken');
  
  // 🚨 Si no hay token, redirigir según el CONTEXTO de la ruta
  if (!token) {
    return isPatientRoute 
      ? <Navigate to="/patient/login" replace />
      : <Navigate to="/login" replace />;
  }
  
  // ✅ Obtener rol del usuario
  const userRole = localStorage.getItem('userRole') || (isPatientRoute ? 'patient' : 'doctor');
  
  // 🚨 Verificar restricciones de rol
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole as any)) {
    if (userRole === 'patient') {
      return <Navigate to="/patient" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  // ✅ Renderizar children o Outlet
  return children ? <>{children}</> : <Outlet />;
}