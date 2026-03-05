// src/hooks/useAuthGuard.ts
import { useState } from "react";
export function useAuthGuard() {
  // ✅ SIMPLIFICADO: ProtectedRoute maneja toda la lógica de autenticación
  // Este hook solo existe por compatibilidad con otros componentes
  const [checking] = useState(false);
  
  return { checking };
}