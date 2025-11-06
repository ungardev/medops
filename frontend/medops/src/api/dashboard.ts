const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

// ⚠️ Aquí deberías obtener el token desde localStorage o contexto
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

export const DashboardAPI = {
  summary: (params?: { start_date?: string; end_date?: string }) => {
    const qp = params ? `?${new URLSearchParams(params as any).toString()}` : "";
    return get<import("@/types/dashboard").DashboardSummary>(
      `/dashboard/summary/${qp}`
    );
  },

  notifications: () =>
    get<import("@/types/dashboard").NotificationEvent[]>(`/notifications/`),

  waitingRoomToday: () =>
    get<import("@/types/dashboard").AppointmentSummary[]>(
      `/waitingroom/today/entries/`
    ),

  appointmentsToday: () =>
    get<import("@/types/dashboard").AppointmentSummary[]>(`/appointments/today/`),

  eventLog: () =>
    get<import("@/types/dashboard").EventLogEntry[]>(`/event_log/`),

  payments: () =>
    get<import("@/types/dashboard").PaymentSummary[]>(`/payments/`),
};
