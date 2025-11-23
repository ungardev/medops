const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";
const token = localStorage.getItem("authToken");

async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    credentials: "include",
    ...init,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// 🔹 Util institucional para blindar respuestas
function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && Array.isArray((raw as any).results)) {
    return (raw as any).results as T[];
  }
  return [];
}

type DashboardParams = {
  start_date?: string;
  end_date?: string;
  range?: "day" | "week" | "month";
  currency?: "USD" | "VES";
};

export const DashboardAPI = {
  summary: (params?: DashboardParams) => {
    const query = params ? new URLSearchParams(params as any).toString() : "";
    const qp = query ? `?${query}` : "";
    return get<import("@/types/dashboard").DashboardSummary>(
      `/dashboard/summary${qp}`
    );
  },

  notifications: () =>
    get<import("@/types/dashboard").NotificationEvent[]>(`/notifications/`),

  waitingRoomToday: async () => {
    const raw = await get<any>(`/waitingroom/today/entries/`);
    return toArray<import("@/types/dashboard").AppointmentSummary>(raw);
  },

  appointmentsToday: async () => {
    const raw = await get<any>(`/appointments/today/`);
    return toArray<import("@/types/dashboard").AppointmentSummary>(raw);
  },

  payments: async () => {
    const raw = await get<any>(`/payments/`);
    return toArray<import("@/types/dashboard").PaymentSummary>(raw);
  },

  eventLog: () =>
    get<import("@/types/dashboard").EventLogEntry[]>(`/event_log/`),
};
