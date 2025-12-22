// src/hooks/patients/usePersonalHistory.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export function usePersonalHistory(patientId: number) {
  const queryClient = useQueryClient();
  const listKey = ["personal-history", patientId];

  // --- Listar antecedentes personales ---
  const query = useQuery({
    queryKey: listKey,
    queryFn: () => apiFetch(`personal-history/?patient=${patientId}`),
  });

  // --- Crear antecedente personal ---
  const create = useMutation({
    mutationFn: (data: any) =>
      apiFetch("personal-history/", {
        method: "POST",
        body: JSON.stringify({ ...data, patient: patientId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  // --- Actualizar antecedente personal ---
  const update = useMutation({
    mutationFn: (data: any) =>
      apiFetch(`personal-history/${data.id}/`, {
        method: "PUT",
        body: JSON.stringify({ ...data, patient: patientId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  // --- Eliminar antecedente personal ---
  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`personal-history/${id}/`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  return { query, create, update, remove };
}
