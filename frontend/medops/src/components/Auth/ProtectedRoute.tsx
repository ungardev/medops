// src/components/Auth/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
interface ProtectedRouteProps {
  allowedRoles?: ('doctor' | 'patient' | 'admin')[];
  children?: ReactNode;
}
export function ProtectedRoute({ allowedRoles = ['doctor', 'admin'], children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  const path = window.location.pathname;
  const isPatientRoute = path === '/patient' || path.startsWith('/patient/');
  
  const expectedRole = isPatientRoute ? 'patient' : 'doctor';
  
  // 🔍 DEBUG LOGS
  console.log('🛡️ ProtectedRoute - path:', path);
  console.log('🛡️ ProtectedRoute - isPatientRoute:', isPatientRoute);
  console.log('🛡️ ProtectedRoute - isLoading:', isLoading);
  console.log('🛡️ ProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('🛡️ ProtectedRoute - user:', user);
  console.log('🛡️ ProtectedRoute - allowedRoles:', allowedRoles);
  console.log('🛡️ ProtectedRoute - expectedRole:', expectedRole);
  
  if (isLoading) {
    console.log('🛡️ ProtectedRoute - MOSTRANDO LOADER (isLoading = true)');
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 text-sm">Verificando autenticación...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    console.log('🔴 ProtectedRoute - NO AUTENTICADO, redirigiendo a:', isPatientRoute ? '/patient/login' : '/login');
    return isPatientRoute 
      ? <Navigate to="/patient/login" replace />
      : <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && user) {
    const userRole = user.is_superuser ? 'admin' : expectedRole;
    console.log('🛡️ ProtectedRoute - userRole:', userRole, 'allowedRoles:', allowedRoles);
    if (!allowedRoles.includes(userRole as any)) {
      console.log('🔴 ProtectedRoute - ROL NO PERMITIDO, redirigiendo');
      if (userRole === 'patient') {
        return <Navigate to="/patient" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }
  
  console.log('🟢 ProtectedRoute - RENDERIZANDO CONTENIDO');
  return children ? <>{children}</> : <Outlet />;
}