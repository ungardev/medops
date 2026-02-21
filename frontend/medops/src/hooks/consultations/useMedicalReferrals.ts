// src/hooks/consultations/useMedicalReferrals.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { MedicalReferral } from "../../types/consultation";
export function useMedicalReferrals(appointmentId: number) {
  return useQuery<MedicalReferral[], Error>({
    queryKey: ["medical-referrals", appointmentId],
    queryFn: async (): Promise<MedicalReferral[]> => {
      console.debug("📡 Fetching medical referrals for appointment:", appointmentId);
      const data = await apiFetch<{ count: number; results: MedicalReferral[] }>(
        `medical-referrals/?appointment=${appointmentId}`
      );
      return data?.results ?? [];
    },
    enabled: !!appointmentId,
  });
}
export function useCreateMedicalReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<MedicalReferral> & { appointment: number }) => {
      const finalPayload = {
        appointment: payload.appointment,
        diagnosis: payload.diagnosis ?? null,
        referred_to_external: payload.referred_to_external ?? "",
        reason: payload.reason ?? "",
        specialty_ids: payload.specialty_ids ?? [],
        urgency: payload.urgency ?? "routine",
        status: payload.status ?? "issued",
      };
      console.debug("📤 Payload final (create):", finalPayload);
      const data = await apiFetch<MedicalReferral>("medical-referrals/", {
        method: "POST",
        body: JSON.stringify(finalPayload),
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["medical-referrals", variables.appointment],
      });
    },
  });
}
export function useUpdateMedicalReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<MedicalReferral> & { id: number; appointment: number }) => {
      const finalPayload = {
        appointment: payload.appointment,
        diagnosis: payload.diagnosis ?? null,
        referred_to_external: payload.referred_to_external ?? "",
        reason: payload.reason ?? "",
        specialty_ids: payload.specialty_ids ?? [],
        urgency: payload.urgency ?? "routine",
        status: payload.status ?? "issued",
      };
      console.debug("📤 Payload final (update):", finalPayload);
      const data = await apiFetch<MedicalReferral>(`medical-referrals/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(finalPayload),
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["medical-referrals", variables.appointment],
      });
    },
  });
}
export function useDeleteMedicalReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, appointment }: { id: number; appointment: number }) => {
      await apiFetch<{}>(`medical-referrals/${id}/`, { method: "DELETE" });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["medical-referrals", variables.appointment],
      });
    },
  });
}