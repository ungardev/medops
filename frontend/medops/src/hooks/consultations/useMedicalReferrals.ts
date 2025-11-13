import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { MedicalReferral } from "../../types/consultation";

// 👇 endpoint relativo, sin /api
const API_URL = "medical-referrals/";

export function useMedicalReferrals(appointmentId: number) {
  return useQuery<MedicalReferral[], Error>({
    queryKey: ["medical-referrals", appointmentId],
    queryFn: async (): Promise<MedicalReferral[]> => {
      const { data } = await axios.get<MedicalReferral[]>(API_URL, {
        params: { appointment: appointmentId },
      });
      return data;
    },
  });
}

export function useCreateMedicalReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<MedicalReferral>) => {
      // 🔹 aplicamos defaults si no vienen del formulario
      const finalPayload = {
        specialty_ids: payload.specialty_ids ?? [], // 👈 ahora enviamos IDs
        urgency: payload.urgency ?? "routine",
        status: payload.status ?? "issued",
        ...payload,
      };
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
        specialty_ids: payload.specialty_ids ?? [], // 👈 aseguramos IDs en update
      };
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
