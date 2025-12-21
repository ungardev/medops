// src/hooks/patients/useSurgeries.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export interface Surgery {
  id: number;
  patient: number;
  name: string;
  hospital: string;
  date: string;
  description?: string;
  status: "programada" | "realizada" | "cancelada";
  doctor?: string;
}

// 👇 definimos un tipo para la posible respuesta del backend
interface SurgeriesResponse {
  results?: Surgery[];
  [key: string]: any; // para evitar error TS en otras props
}

export function useSurgeries(patientId: number) {
  const query = useQuery<Surgery[]>({
    queryKey: ["surgeries", patientId],
    queryFn: async (): Promise<Surgery[]> => {
      const res: SurgeriesResponse | Surgery[] = await apiFetch(
        `surgeries/?patient=${patientId}`
      );

      // Normalizamos: si es array directo, lo devolvemos
      if (Array.isArray(res)) {
        return res;
      }

      // Si es objeto con results, devolvemos ese array
      if (res.results && Array.isArray(res.results)) {
        return res.results;
      }

      // Si no hay nada válido, devolvemos []
      return [];
    },
  });

  const create = useMutation({
    mutationFn: (data: Surgery) =>
      apiFetch("surgeries/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });

  const update = useMutation({
    mutationFn: (data: Surgery) =>
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
