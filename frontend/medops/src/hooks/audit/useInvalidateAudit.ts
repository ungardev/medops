// src/hooks/audit/useInvalidateAudit.ts
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook institucional para invalidar el log de auditoría.
 * Se usa después de registrar eventos críticos (consultas, diagnósticos, órdenes, etc.)
 * para refrescar el panel de auditoría en vivo.
 */
export function useInvalidateAudit() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ["audit-log"] });
  };
}
