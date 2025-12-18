import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export function useSurgeries(patientId: number) {
  const query = useQuery({
    queryKey: ["surgeries", patientId],
    queryFn: () =>
      apiFetch(`surgeries/?patient=${patientId}`),
  });

  const create = useMutation({
    mutationFn: (data: any) =>
      apiFetch("surgeries/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });

  const update = useMutation({
    mutationFn: (data: any) =>
      apiFetch(`surgeries/${data.id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`surgeries/${id}/`, {
        method: "DELETE",
      }),
  });

  return { query, create, update, remove };
}
