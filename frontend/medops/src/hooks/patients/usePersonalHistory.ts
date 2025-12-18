import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export function usePersonalHistory(patientId: number) {
  const query = useQuery({
    queryKey: ["personal-history", patientId],
    queryFn: () =>
      apiFetch(`personal-history/?patient=${patientId}`),
  });

  const create = useMutation({
    mutationFn: (data: any) =>
      apiFetch("personal-history/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });

  const update = useMutation({
    mutationFn: (data: any) =>
      apiFetch(`personal-history/${data.id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`personal-history/${id}/`, {
        method: "DELETE",
      }),
  });

  return { query, create, update, remove };
}
