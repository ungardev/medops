// src/components/Auth/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { isPatientSubdomain, getCurrentPortal, getPortalConfig } from "@/lib/subdomain";

interface ProtectedRouteProps {
  allowedRoles?: ('doctor' | 'patient' | 'admin')[];
  children?: ReactNode;
}

export function ProtectedRoute({ allowedRoles = ['doctor', 'admin'], children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // PRIMARY: Detect via subdomain (not pathname)
  const isPatientPortal = isPatientSubdomain();
  const portal = getCurrentPortal();
  
  // Expand allowedRoles to include patient if on patient subdomain
  const effectiveRoles = isPatientPortal
    ? [...new Set([...allowedRoles, 'patient'])]
    : allowedRoles;
  
  // For subdomain-based detection, use subdomain config
  const portalConfig = getPortalConfig(portal);
  
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
  
  if (!isAuthenticated) {
    // Use subdomain config for redirect target
    return <Navigate to={portalConfig.loginPath} replace />;
  }
  
  if (effectiveRoles.length > 0 && user) {
    const userRole = user.is_superuser ? 'admin' : (isPatientPortal ? 'patient' : 'doctor');
    
    if (!effectiveRoles.includes(userRole as any)) {
      // Route to appropriate dashboard based on role
      const redirectPath = userRole === 'patient' ? '/patient' : '/login';
      return <Navigate to={redirectPath} replace />;
    }
  }
  
  return children ? <>{children}</> : <Outlet />;
}