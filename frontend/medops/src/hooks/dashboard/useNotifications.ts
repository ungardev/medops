// src/hooks/dashboard/useNotifications.ts
import { useQuery } from "@tanstack/react-query";
import { NotificationEvent } from "@/types/notifications";
import { useAuth } from "@/context/AuthContext"; // Cambiado de useAuthToken
import { DashboardAPI } from "@/api/dashboard";
const DAYS_WINDOW = 7;
const MAX_NOTIFICATIONS = 3;
function isWithinDays(ts: string, days: number) {
  const t = new Date(ts).getTime();
  const now = Date.now();
  const diffDays = (now - t) / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}
export function useNotifications() {
  const { tokens } = useAuth(); // Obtener token del contexto
  const token = tokens.authToken; // Token para Doctor Portal
  return useQuery<NotificationEvent[]>({
    queryKey: ["notifications", token],
    enabled: !!token,
    refetchOnMount: true,
    refetchOnReconnect: true,
    retry: 1,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    refetchInterval: 30000,
    queryFn: () => DashboardAPI.notifications(),
  });
}