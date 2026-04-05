// src/hooks/patients/useSurgeries.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { Surgery } from "../../types/patients";
interface SurgeriesResponse {
  results?: Surgery[];
  [key: string]: any;
}
export function useSurgeries(patientId: number) {
  const query = useQuery<Surgery[]>({
    queryKey: ["surgeries", patientId],
    queryFn: async (): Promise<Surgery[]> => {
      const res: SurgeriesResponse | Surgery[] = await apiFetch(
        `surgeries/?patient=${patientId}`
      );
      if (Array.isArray(res)) {
        return res;
      }
      if (res.results && Array.isArray(res.results)) {
        return res.results;
      }
      return [];
    },
  });
  const create = useMutation({
    mutationFn: (data: Partial<Surgery>) =>
      apiFetch("surgeries/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
  const update = useMutation({
    mutationFn: (data: Partial<Surgery> & { id: number }) =>
      apiFetch(`surgeries/${data.id}/`, {
        method: "PATCH",
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