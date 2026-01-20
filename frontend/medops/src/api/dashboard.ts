// src/api/dashboard.ts
import { api } from "@/lib/apiClient"; // 🔒 cliente institucional con interceptor
// 🔹 Util institucional para blindar respuestas
function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && Array.isArray((raw as any).results)) {
    return (raw as any).results as T[];
  }
  return [];
}
export type DashboardParams = {
  start_date?: string;
  end_date?: string;
  range?: "day" | "week" | "month";
  currency?: "USD" | "VES";
};
export const DashboardAPI = {
  summary: async (params?: DashboardParams) => {
    const cleanParams: Record<string, string> = {};
    if (params?.start_date) cleanParams.start_date = params.start_date;
    if (params?.end_date) cleanParams.end_date = params.end_date;
    if (params?.range) cleanParams.range = params.range;
    if (params?.currency) cleanParams.currency = params.currency;
    const query = new URLSearchParams(cleanParams).toString();
    const qp = query ? `?` : "";
    const res = await api.get(`/dashboard/summary`);
    return res.data as import("@/types/dashboard").DashboardSummary;
  },
  notifications: async () => {
    const res = await api.get(`/notifications/`);
    return res.data as import("@/types/notifications").NotificationEvent[];
  },
  waitingRoomToday: async () => {
    const res = await api.get(`/waitingroom/today/entries/`);
    return toArray<import("@/types/dashboard").DashboardAppointmentSummary>(res.data);
  },
  appointmentsToday: async () => {
    const res = await api.get(`/appointments/today/`);
    return toArray<import("@/types/dashboard").DashboardAppointmentSummary>(res.data);
  },
  payments: async () => {
    const res = await api.get(`/payments/`);
    return toArray<import("@/types/dashboard").PaymentSummary>(res.data);
  },
  eventLog: async () => {
    const res = await api.get(`/event_log/`);
    return res.data as import("@/types/dashboard").EventLogEntry[];
  },
};