// src/hooks/patients/useClinicalAlerts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export function useClinicalAlerts(patientId: number) {
  const queryClient = useQueryClient();
  const listKey = ["clinical-alerts", patientId];

  const list = useQuery({
    queryKey: listKey,
    queryFn: async () => {
      const res = await apiFetch(`patients/${patientId}/alerts/`);
      return Array.isArray(res) ? res : [];
    },
  });

  const create = useMutation({
    mutationFn: async (data: { type: string; message: string }) =>
      apiFetch(`patients/${patientId}/alerts/`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { type: string; message: string } }) =>
      apiFetch(`alerts/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) =>
      apiFetch(`alerts/${id}/`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  return { list, create, update, remove };
}
