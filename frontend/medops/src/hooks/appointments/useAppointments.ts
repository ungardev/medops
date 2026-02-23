import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Appointment, AppointmentInput } from "../../types/appointments";
import { apiFetch } from "../../api/client";
import { mapAppointmentList } from "../../utils/appointmentsMapper";

// 🔹 Tipo institucional para paginación
export interface PaginatedAppointments {
  results: Appointment[];
  total: number;
  page: number;
  pageSize: number;
}

// --- GET: lista de citas (paginada o global) ---
export function useAppointments(page?: number, pageSize?: number, date?: string) {
  return useQuery<PaginatedAppointments>({
    queryKey: ["appointments", page, pageSize, date],
    queryFn: async () => {
      const qp = new URLSearchParams();
      if (page) qp.set("page", page.toString());
      if (pageSize) qp.set("page_size", pageSize.toString());
      if (date) qp.set("date", date);

      const raw = await apiFetch<any>(`appointments/?${qp.toString()}`);

      const results = Array.isArray(raw?.results)
        ? raw.results.map(mapAppointmentList)
        : Array.isArray(raw)
        ? raw.map(mapAppointmentList)
        : [];

      const total = typeof raw?.count === "number" ? raw.count : results.length;

      return {
        results,
        total,
        page: page ?? 1,
        pageSize: pageSize ?? results.length,
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

// --- GET: detalle de cita ---
export function useAppointment(id: number) {
  return useQuery<Appointment>({
    queryKey: ["appointments", id],
    queryFn: async () => {
      if (!id) throw new Error("Appointment id requerido");

      // 🔹 Fetch directo al detalle
      const raw = await apiFetch<any>(`appointments/${id}/`);

      // 🔹 Map general
      const a = mapAppointmentList(raw);

      // 🔹 Blindaje de charge_order e hijos
      const co = raw?.charge_order ?? a?.charge_order ?? null;
      const items = Array.isArray(co?.items) ? co.items : [];
      const payments = Array.isArray(co?.payments) ? co.payments : [];

      return {
        ...a,
        appointment_date: a.appointment_date?.slice(0, 10) ?? a.appointment_date,
        charge_order: co
          ? {
              ...co,
              total: Number(co?.total ?? 0),
              balance_due: Number(co?.balance_due ?? 0),
              items,
              payments,
            }
          : null,
      } as Appointment;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// --- POST: crear cita ---
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AppointmentInput) => {
      const raw = await apiFetch<Appointment>(`appointments/`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return mapAppointmentList(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

// --- POST: cancelar cita (cambiar status a canceled) ---
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const raw = await apiFetch<Appointment>(`appointments/${id}/status/`, {
        method: "POST",  // ✅ FIX: Cambiado de PATCH a POST
        body: JSON.stringify({ status: "canceled" }),
      });
      return mapAppointmentList(raw);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
