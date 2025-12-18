import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export function useHabits(patientId: number) {
  const query = useQuery({
    queryKey: ["habits", patientId],
    queryFn: () =>
      apiFetch(`habits/?patient=${patientId}`),
  });

  const create = useMutation({
    mutationFn: (data: any) =>
      apiFetch("habits/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });

  const update = useMutation({
    mutationFn: (data: any) =>
      apiFetch(`habits/${data.id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`habits/${id}/`, {
        method: "DELETE",
      }),
  });

  return { query, create, update, remove };
}
