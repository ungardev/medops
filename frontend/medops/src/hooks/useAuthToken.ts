import { useState, useEffect, useCallback } from "react";

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("authToken") // ✅ lazy init
  );

  // ✅ Guardar token
  const saveToken = useCallback((newToken: string) => {
    localStorage.setItem("authToken", newToken);
    setToken(newToken);
  }, []);

  // ✅ Limpiar token
  const clearToken = useCallback(() => {
    localStorage.removeItem("authToken");
    setToken(null);
  }, []);

  // ✅ Sincronizar entre pestañas
  useEffect(() => {
    const syncToken = (e: StorageEvent) => {
      if (e.key === "authToken") {
        setToken(e.newValue);
      }
    };
    window.addEventListener("storage", syncToken);
    return () => window.removeEventListener("storage", syncToken);
  }, []);

  return { token, saveToken, clearToken };
}
