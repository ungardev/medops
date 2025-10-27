// src/hooks/useAuthGuard.ts
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function useAuthGuard() {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      // 🚨 No hay token → redirigir
      navigate("/login", { replace: true });
    } else {
      // ✅ Token presente → continuar
      setChecking(false);
    }
  }, [navigate]);

  return { checking };
}
