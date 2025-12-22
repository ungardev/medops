// src/hooks/patients/useFamilyHistory.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export function useFamilyHistory(patientId: number) {
  const queryClient = useQueryClient();
  const listKey = ["family-history", patientId];

  // --- Listar antecedentes familiares ---
  const query = useQuery({
    queryKey: listKey,
    queryFn: () => apiFetch(`family-history/?patient=${patientId}`),
  });

  // --- Crear antecedente familiar ---
  const create = useMutation({
    mutationFn: (data: any) =>
      apiFetch("family-history/", {
        method: "POST",
        body: JSON.stringify({ ...data, patient: patientId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  // --- Actualizar antecedente familiar ---
  const update = useMutation({
    mutationFn: (data: any) =>
      apiFetch(`family-history/${data.id}/`, {
        method: "PUT",
        body: JSON.stringify({ ...data, patient: patientId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  // --- Eliminar antecedente familiar ---
  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`family-history/${id}/`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  return { query, create, update, remove };
}
