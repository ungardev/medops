// src/hooks/patients/useHospitalizations.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { Hospitalization } from "../../types/patients";
interface HospitalizationsResponse {
  results?: Hospitalization[];
  [key: string]: any;
}
export function useHospitalizations(patientId: number) {
  const query = useQuery<Hospitalization[]>({
    queryKey: ["hospitalizations", patientId],
    queryFn: async (): Promise<Hospitalization[]> => {
      const res: HospitalizationsResponse | Hospitalization[] = await apiFetch(
        `hospitalizations/?patient=${patientId}`
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
    mutationFn: (data: Partial<Hospitalization>) =>
      apiFetch("hospitalizations/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
  const update = useMutation({
    mutationFn: (data: Partial<Hospitalization> & { id: number }) =>
      apiFetch(`hospitalizations/${data.id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  });
  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`hospitalizations/${id}/`, {
        method: "DELETE",
      }),
  });
  return { query, create, update, remove };
}