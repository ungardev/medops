// types/notifications.ts
export type NotificationType = "info" | "success" | "warning" | "error";

export interface NotificationEvent {
  id: number;
  type: NotificationType;
  message: string;
  timestamp: string; // ISO date
  action?: { label: string; href: string };
}
