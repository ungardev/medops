// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useAuthToken } from "../hooks/useAuthToken";

export function ProtectedRoute() {
  const { checking } = useAuthGuard();
  const { token } = useAuthToken();

  if (checking) {
    return <p>Verificando sesión...</p>; // 🔹 aquí podrías poner un spinner
  }

  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
