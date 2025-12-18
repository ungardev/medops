import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export function useFamilyHistory(patientId: number) {
  const query = useQuery({
    queryKey: ["family-history", patientId],
    queryFn: () =>
      apiFetch(`family-history/?patient=${patientId}`),
  });

  const create = useMutation({
    mutationFn: (data: any) =>
      apiFetch("family-history/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });

  const update = useMutation({
    mutationFn: (data: any) =>
      apiFetch(`family-history/${data.id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`family-history/${id}/`, {
        method: "DELETE",
      }),
  });

  return { query, create, update, remove };
}
