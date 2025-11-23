import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { MedicalTest } from "../../types/consultation";

// 👇 endpoint relativo, sin /api
const API_URL = "medical-tests/";

export function useMedicalTest(appointmentId: number) {
  return useQuery<MedicalTest[], Error>({
    queryKey: ["medical-test", appointmentId],
    queryFn: async (): Promise<MedicalTest[]> => {
      console.debug("📡 Fetching medical tests for appointment:", appointmentId);
      const { data } = await axios.get<MedicalTest[]>(API_URL, {
        params: { appointment: appointmentId },
      });
      return data;
    },
    enabled: !!appointmentId, // ✅ solo dispara si el ID existe
  });
}

export function useCreateMedicalTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<MedicalTest>) => {
      const finalPayload = {
        urgency: payload.urgency ?? "routine",
        status: payload.status ?? "pending",
        ...payload,
      };
      const { data } = await axios.post<MedicalTest>(API_URL, finalPayload);
      return data;
    },
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["medical-test", variables.appointment],
      });
    },
  });
}

export function useUpdateMedicalTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<MedicalTest> & { id: number }) => {
      const { data } = await axios.patch<MedicalTest>(`${API_URL}${id}/`, payload);
      return data;
    },
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["medical-test", variables.appointment],
      });
    },
  });
}

export function useDeleteMedicalTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: number; appointment: number }) => {
      await axios.delete(`${API_URL}${id}/`);
    },
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: ["medical-test", variables.appointment],
      });
    },
  });
}
