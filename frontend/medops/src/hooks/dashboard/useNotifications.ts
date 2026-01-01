// src/hooks/dashboard/useNotifications.ts
import { useQuery } from "@tanstack/react-query";
import { NotificationEvent } from "@/types/notifications";
import { useAuthToken } from "@/hooks/useAuthToken";

const DAYS_WINDOW = 7;
const MAX_NOTIFICATIONS = 3;

function isWithinDays(ts: string, days: number) {
  const t = new Date(ts).getTime();
  const now = Date.now();
  const diffDays = (now - t) / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

export function useNotifications() {
  const { token } = useAuthToken();

  return useQuery<NotificationEvent[]>({
    queryKey: ["notifications", token],
    enabled: !!token,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Error al cargar notificaciones");
      }
      const data = (await res.json()) as NotificationEvent[];
      console.log("📦 Notificaciones desde API:", data);

      // 🔹 Ordenar por recencia
      const sorted = [...data].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // 🔹 Filtrar por ventana temporal (últimos 7 días)
      const recent = sorted.filter((n) => isWithinDays(n.timestamp, DAYS_WINDOW));

      // 🔹 Tomar las 3 más recientes (aunque sean de la misma categoría)
      const top = recent.slice(0, MAX_NOTIFICATIONS);

      // 🔹 Fallback institucional
      if (top.length === 0) {
        return [
          {
            id: 0,
            timestamp: new Date().toISOString(),
            actor: "Sistema",
            entity: "Dashboard",
            entity_id: 0,
            action: "other",
            badge_action: "other",
            severity: "info",
            notify: false,
            title: "Sin actividad reciente",
            description: "No hay eventos en la última semana",
            category: "dashboard.other",
          },
        ];
      }

      return top;
    },
  });
}
