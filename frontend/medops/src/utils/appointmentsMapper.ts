import type { Appointment } from "../types/appointments";
import type { AppointmentStatus } from "../types/appointments";

// 🔹 Normalización defensiva de estados
function normalizeStatus(status: string | null | undefined): AppointmentStatus {
  switch (status) {
    case "scheduled":
      return "pending";
    case "in_progress":
      return "in_consultation";
    case "pending":
    case "arrived":
    case "in_consultation":
    case "completed":
    case "canceled":
      return status;
    default:
      return "pending"; // fallback seguro
  }
}

export function mapAppointmentList(raw: any): Appointment {
  const co = raw?.charge_order ?? undefined;
  const items = Array.isArray(co?.items) ? co.items : [];
  const payments = Array.isArray(co?.payments) ? co.payments : [];

  return {
    id: raw.id,
    patient: raw.patient ?? { id: 0, full_name: "" }, // 🔹 ya no metemos age si tu tipo no lo soporta
    appointment_date: raw.appointment_date?.slice(0, 10) ?? "",
    appointment_type: raw.appointment_type ?? "general",
    expected_amount:
      typeof raw.expected_amount === "number"
        ? raw.expected_amount
        : String(raw.expected_amount ?? ""),
    status: normalizeStatus(raw.status),
    arrival_time: raw.arrival_time ?? null,
    notes: raw.notes ?? "",
    diagnoses: Array.isArray(raw.diagnoses) ? raw.diagnoses : [],
    treatments: Array.isArray(raw.treatments) ? raw.treatments : [],
    prescriptions: Array.isArray(raw.prescriptions) ? raw.prescriptions : [],
    documents: Array.isArray(raw.documents) ? raw.documents : [],
    payments: Array.isArray(raw.payments) ? raw.payments : [],
    charge_order: co
      ? {
          ...co,
          total: Number(co?.total ?? 0),
          balance_due: Number(co?.balance_due ?? 0),
          items,
          payments,
        }
      : undefined, // 🔹 ahora sí compatible con tu tipo
    balance_due: Number(raw.balance_due ?? 0),
    created_at: raw.created_at ?? "",
    updated_at: raw.updated_at ?? "",
  };
}
