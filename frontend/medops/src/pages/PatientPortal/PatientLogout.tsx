// src/pages/PatientPortal/PatientLogout.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
export default function PatientLogout() {
  const navigate = useNavigate();
  useEffect(() => {
    // Limpiar todos los tokens del paciente
    localStorage.removeItem("patient_access_token");
    localStorage.removeItem("patient_refresh_token");
    localStorage.removeItem("patient_drf_token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("patient_name");
    
    // Redirigir al login
    navigate("/patient/login");
  }, [navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c10]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm">Cerrando sesión...</p>
      </div>
    </div>
  );
}