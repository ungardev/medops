// src/hooks/appointments/useAppointments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Appointment, AppointmentInput } from "../../types/appointments";

// 🔹 Helper genérico para fetch (ajústalo a tu apiFetch/axios centralizado)
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`, // si usas JWT
    },
    credentials: "include", // si usas cookies de sesión
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// --- GET: lista de citas ---
export function useAppointments(params?: { date?: string }) {
  return useQuery<Appointment[]>({
    queryKey: ["appointments", params],
    queryFn: () => {
      const query = params?.date ? `?date=${params.date}` : "";
      return apiFetch<Appointment[]>(`/api/appointments/${query}`);
    },
  });
}

// --- GET: detalle de cita ---
export function useAppointment(id: number) {
  return useQuery<Appointment>({
    queryKey: ["appointments", id],
    queryFn: () => apiFetch<Appointment>(`/api/appointments/${id}/`),
    enabled: !!id,
  });
}

// --- POST: crear cita ---
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointmentInput) =>
      apiFetch<Appointment>(`/api/appointments/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

// --- PATCH: cancelar cita ---
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<Appointment>(`/api/appointments/${id}/cancel/`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
