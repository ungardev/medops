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
  
  // Detectar rutas de paciente
  const path = window.location.pathname;
  const isPatientRoute = path === '/patient' || path.startsWith('/patient/');
  
  // Determinar rol esperado
  const expectedRole = isPatientRoute ? 'patient' : 'doctor';
  
  // Si está cargando, mostrar loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70 text-sm">Verificando autenticación...</p>
        </div>
      </div>
    );
  }
  
  // Si no está autenticado, redirigir a login apropiado
  if (!isAuthenticated) {
    return isPatientRoute 
      ? <Navigate to="/patient/login" replace />
      : <Navigate to="/login" replace />;
  }
  
  // Verificar roles si se especifican
  if (allowedRoles.length > 0 && user) {
    const userRole = user.is_superuser ? 'admin' : expectedRole;
    if (!allowedRoles.includes(userRole as any)) {
      if (userRole === 'patient') {
        return <Navigate to="/patient" replace />;
      }
      return <Navigate to="/login" replace />;
    }
  }
  
  // Renderizar children o Outlet
  return children ? <>{children}</> : <Outlet />;
}