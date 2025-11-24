// src/hooks/consultations/useMedicalReferrals.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { MedicalReferral } from "../../types/consultation";

// ✅ Endpoint relativo para evitar doble /api cuando baseURL ya es "/api/"
const API_URL = "medical-referrals/";

export function useMedicalReferrals(appointmentId: number) {
  return useQuery<MedicalReferral[], Error>({
    queryKey: ["medical-referrals", appointmentId],
    queryFn: async (): Promise<MedicalReferral[]> => {
      console.debug("📡 Fetching medical referrals for appointment:", appointmentId);
      const { data } = await axios.get<{ count: number; results: MedicalReferral[] }>(API_URL, {
        params: { appointment: appointmentId },
      });
      return data.results;
    },
    enabled: !!appointmentId,
  });
}

export function useCreateMedicalReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<MedicalReferral>) => {
      const finalPayload = {
        ...payload,
        specialty_ids: payload.specialty_ids ?? [],
        urgency: payload.urgency ?? "routine",
        status: payload.status ?? "issued",
      };

      console.debug("📤 Payload final (create):", finalPayload);

      const { data } = await axios.post<MedicalReferral>(API_URL, finalPayload);
      return data;
    },
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["medical-referrals", variables.appointment],
      });
    },
  });
}

export function useUpdateMedicalReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<MedicalReferral> & { id: number }) => {
      const finalPayload = {
        ...payload,
        specialty_ids: payload.specialty_ids ?? [],
      };

      console.debug("📤 Payload final (update):", finalPayload);

      const { data } = await axios.patch<MedicalReferral>(`${API_URL}${id}/`, finalPayload);
      return data;
    },
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["medical-referrals", variables.appointment],
      });
    },
  });
}

export function useDeleteMedicalReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number; appointment: number }) => {
      await axios.delete(`${API_URL}${id}/`);
    },
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["medical-referrals", variables.appointment],
      });
    },
  });
}
