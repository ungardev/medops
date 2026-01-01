// src/hooks/dashboard/useNotifications.ts
import { useQuery } from "@tanstack/react-query";
import { NotificationEvent } from "@/types/notifications";
import { useAuthToken } from "@/hooks/useAuthToken";

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
      const data = await res.json();
      console.log("📦 Notificaciones desde API:", data);
      return data as NotificationEvent[];
    },
  });
}
