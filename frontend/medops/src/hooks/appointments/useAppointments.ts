// src/hooks/appointments/useAppointments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Appointment, AppointmentInput } from "../../types/appointments";
import { apiFetch } from "../../api/client"; // 👈 usa tu helper centralizado
import { mapAppointmentList } from "../../utils/appointmentsMapper";

// --- GET: lista de citas ---
export function useAppointments(params?: { date?: string }) {
  return useQuery<Appointment[]>({
    queryKey: ["appointments", params],
    queryFn: async () => {
      const query = params?.date ? `?date=${params.date}` : "";
      const raw = await apiFetch<Appointment[]>(`/api/appointments/${query}`);
      return raw.map(mapAppointmentList); // 👈 normalización
    },
  });
}

// --- GET: detalle de cita ---
export function useAppointment(id: number) {
  return useQuery<Appointment>({
    queryKey: ["appointments", id],
    queryFn: async () => {
      const raw = await apiFetch<Appointment>(`/api/appointments/${id}/`);
      return mapAppointmentList(raw); // 👈 normalización
    },
    enabled: !!id,
  });
}

// --- POST: crear cita ---
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AppointmentInput) => {
      const raw = await apiFetch<Appointment>(`/api/appointments/`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return mapAppointmentList(raw); // 👈 normalización
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

// --- PATCH: cancelar cita ---
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const raw = await apiFetch<Appointment>(`/api/appointments/${id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status: "canceled" }), // 👈 payload correcto
      });
      return mapAppointmentList(raw); // 👈 normalización
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
