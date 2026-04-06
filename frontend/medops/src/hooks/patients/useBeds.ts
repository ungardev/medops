// src/hooks/patients/useBeds.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { Bed } from "../../types/patients";
interface BedsResponse {
  results?: Bed[];
  [key: string]: any;
}
export function useBeds(institutionId?: number) {
  const query = useQuery<Bed[]>({
    queryKey: ["beds", institutionId],
    queryFn: async (): Promise<Bed[]> => {
      const params = institutionId ? `?institution=${institutionId}` : "";
      const res: BedsResponse | Bed[] = await apiFetch(`beds/${params}`);
      if (Array.isArray(res)) return res;
      if (res.results && Array.isArray(res.results)) return res.results;
      return [];
    },
  });
  const create = useMutation({
    mutationFn: (data: Partial<Bed>) =>
      apiFetch("beds/", { method: "POST", body: JSON.stringify(data) }),
  });
  const update = useMutation({
    mutationFn: (data: Partial<Bed> & { id: number }) =>
      apiFetch(`beds/${data.id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  });
  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`beds/${id}/`, { method: "DELETE" }),
  });
  return { query, create, update, remove };
}
export function useBedStats(institutionId?: number) {
  return useQuery({
    queryKey: ["bed-stats", institutionId],
    queryFn: async () => {
      const params = institutionId ? `?institution=${institutionId}` : "";
      return apiFetch(`beds/stats/${params}`);
    },
  });
}