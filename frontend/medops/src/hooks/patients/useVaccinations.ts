import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export function useVaccinations(patientId: number) {
  const vaccinations = useQuery({
    queryKey: ["vaccinations", patientId],
    queryFn: () =>
      apiFetch(`patient-vaccinations/?patient=${patientId}`),
  });

  const schedule = useQuery({
    queryKey: ["vaccination-schedule"],
    queryFn: () =>
      apiFetch(`vaccination-schedule/?country=Venezuela`),
  });

  const create = useMutation({
    mutationFn: (data: any) =>
      apiFetch("patient-vaccinations/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });

  const update = useMutation({
    mutationFn: (data: any) =>
      apiFetch(`patient-vaccinations/${data.id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  });

  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`patient-vaccinations/${id}/`, {
        method: "DELETE",
      }),
  });

  return { vaccinations, schedule, create, update, remove };
}
