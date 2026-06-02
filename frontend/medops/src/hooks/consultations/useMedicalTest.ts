import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { MedicalTest } from "../../types/consultation";

export function useMedicalTest(appointmentId: number) {
  return useQuery<MedicalTest[], Error>({
    queryKey: ["medical-test", appointmentId],
    queryFn: async (): Promise<MedicalTest[]> => {
      console.debug("📡 Fetching medical tests for appointment:", appointmentId);
      const data = await apiFetch<{ count: number; results: MedicalTest[] }>(
        `medical-tests/?appointment=${appointmentId}`,
        { method: "GET" }
      );
      return data.results;
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    placeholderData: keepPreviousData,
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
    onMutate: async (newTest) => {
      await queryClient.cancelQueries({ queryKey: ["medical-test", newTest.appointment] });
      const previous = queryClient.getQueryData(["medical-test", newTest.appointment]);
      
      queryClient.setQueryData(["medical-test", newTest.appointment], (old: any) => {
        if (!old) return old;
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const optimisticTest = {
          id: tempId,
          appointment: newTest.appointment,
          test_type: newTest.test_type,
          description: newTest.description,
          urgency: newTest.urgency || "routine",
          status: newTest.status || "pending",
          test_type_display: newTest.test_type ? newTest.test_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : newTest.test_type,
          isOptimistic: true,
        };
        return [...(Array.isArray(old) ? old : []), optimisticTest];
      });
      
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["medical-test", _vars.appointment], context.previous);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["medical-test", variables.appointment],
      });
    },
    onSettled: (_, _vars, context) => {
      queryClient.invalidateQueries({ queryKey: ["medical-test"] });
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
