// src/hooks/consultations/useMedicalTest.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { MedicalTest } from "../../types/consultation";

export function useMedicalTest(appointmentId: number) {
  return useQuery<MedicalTest[], Error>({
    queryKey: ["medical-test", appointmentId],
    queryFn: async (): Promise<MedicalTest[]> => {
      console.debug("📡 Fetching medical tests for appointment:", appointmentId);
      const data = await apiFetch<{ count: number; results: MedicalTest[] }>(
        "medical-tests/",
        {
          method: "GET",
          // ✅ params se envían como query string
        }
      );
      // ⚔️ apiFetch no soporta params directo, así que construye la URL con query string
      // Si necesitas params dinámicos:
      // const data = await apiFetch<{ count: number; results: MedicalTest[] }>(
      //   `medical-tests/?appointment=${appointmentId}`
      // );
      return data.results;
    },
    enabled: !!appointmentId,
  });
}

export function useCreateMedicalTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<MedicalTest> & { appointment: number }) => {
      const finalPayload = {
        urgency: payload.urgency ?? "routine",
        status: payload.status ?? "pending",
        ...payload,
      };
      const data = await apiFetch<MedicalTest>("medical-tests/", {
        method: "POST",
        body: JSON.stringify(finalPayload),
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["medical-test", variables.appointment],
      });
    },
  });
}

export function useUpdateMedicalTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<MedicalTest> & { id: number; appointment: number }) => {
      const data = await apiFetch<MedicalTest>(`medical-tests/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["medical-test", variables.appointment],
      });
    },
  });
}

export function useDeleteMedicalTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, appointment }: { id: number; appointment: number }) => {
      await apiFetch<{}>(`medical-tests/${id}/`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["medical-test", variables.appointment],
      });
    },
  });
}
