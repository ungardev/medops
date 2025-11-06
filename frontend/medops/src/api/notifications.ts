// src/api/notifications.ts
import { NotificationEvent } from "types/notifications";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export async function getNotifications(): Promise<NotificationEvent[]> {
  const res = await fetch(`${BASE_URL}/notifications/`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
