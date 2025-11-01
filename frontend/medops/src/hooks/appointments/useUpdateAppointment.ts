// src/hooks/appointments/useUpdateAppointment.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Appointment, AppointmentInput } from "../../types/appointments";

// 🔹 Helper genérico (puedes reemplazarlo por tu apiFetch centralizado)
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    ...options,
  });
  if (!res.ok) {
    throw new Error(`Error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// --- PATCH/PUT: actualizar cita ---
export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AppointmentInput }) =>
      apiFetch<Appointment>(`/api/appointments/${id}/`, {
        method: "PATCH", // o "PUT" si tu backend lo requiere
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      // Invalida la cache para refrescar lista y detalle
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
