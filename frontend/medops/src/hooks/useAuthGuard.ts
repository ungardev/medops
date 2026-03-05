// useAuthGuard.ts - FIX COMPLETO
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
export function useAuthGuard() {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    // ✅ DETECTAR tipo de ruta
    const isPatientRoute = window.location.pathname.startsWith('/patient');
    
    // ✅ Seleccionar token correcto
    const token = isPatientRoute 
      ? localStorage.getItem('patient_access_token')
      : localStorage.getItem('authToken');
    if (!token) {
      // ✅ Redirigir al login correcto
      const loginPath = isPatientRoute ? '/patient/login' : '/login';
      navigate(loginPath, { replace: true });
    } else {
      setChecking(false);
    }
  }, [navigate]);
  return { checking };
}