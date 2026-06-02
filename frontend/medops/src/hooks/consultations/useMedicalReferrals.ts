// src/hooks/consultations/useMedicalReferrals.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
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
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
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
    onMutate: async (newReferral) => {
      await queryClient.cancelQueries({ queryKey: ["medical-referrals", newReferral.appointment] });
      const previous = queryClient.getQueryData(["medical-referrals", newReferral.appointment]);
      
      queryClient.setQueryData(["medical-referrals", newReferral.appointment], (old: any) => {
        if (!old) return old;
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const optimisticReferral = {
          id: tempId,
          appointment: newReferral.appointment,
          diagnosis: newReferral.diagnosis,
          referred_to_external: newReferral.referred_to_external,
          referred_to: newReferral.referred_to_external,
          reason: newReferral.reason,
          specialty_ids: newReferral.specialty_ids || [],
          urgency: newReferral.urgency || "routine",
          status: newReferral.status || "issued",
          specialties: [],
          isOptimistic: true,
        };
        return {
          ...old,
          results: [...(old.results || []), optimisticReferral],
        };
      });
      
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["medical-referrals", _vars.appointment], context.previous);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["medical-referrals", variables.appointment],
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-referrals"] });
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