// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthGuard } from "hooks/useAuthGuard";
import { useAuthToken } from "hooks/useAuthToken";

export function ProtectedRoute() {
  const { checking } = useAuthGuard();
  const { token } = useAuthToken();

  // ✅ Leer API root desde variables de entorno
  const apiRoot = import.meta.env.VITE_API_URL || "http://127.0.0.1/api/";

  if (checking) {
    return <p>Verificando sesión...</p>; // 🔹 aquí podrías poner un spinner institucional
  }

  // ✅ Si no hay token, redirigir a login institucional
  return token ? <Outlet /> : <Navigate to={`${apiRoot}login`} replace />;
}
