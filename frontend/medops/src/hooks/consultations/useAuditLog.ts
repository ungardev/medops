// src/hooks/consultations/useAuditLog.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export interface AuditEvent {
  id?: number;
  action: string;
  actor: string;
  timestamp: string;
  entity?: string;
  entity_id?: number;
  metadata?: Record<string, any>;
}

export function useAuditLog(appointmentId: number) {
  return useQuery<AuditEvent[]>({
    queryKey: ["auditLog", appointmentId],
    queryFn: async () => {
      const res = await apiFetch(`audit/appointment/${appointmentId}/`);
      return res as AuditEvent[];
    },
    refetchInterval: 30_000, // 🔄 refresco automático cada 30s
  });
}
