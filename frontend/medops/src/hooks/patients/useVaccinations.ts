import { useQuery, useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

// Tipos institucionales
export interface Vaccine {
  id: number;
  code: string;
  name: string;
  description?: string;
  country: string;
}

export interface VaccinationSchedule {
  id: number;
  vaccine: number;          // ID de la vacuna
  vaccine_detail: Vaccine;  // objeto completo con code, name, country
  recommended_age_months: number;
  dose_number: number;
  country: string;
}

export interface PatientVaccination {
  id: number;
  patient: number;
  vaccine: number;          // ID de la vacuna
  vaccine_detail: Vaccine;  // objeto completo recibido del backend
  dose_number: number;
  date_administered: string;
  lot?: string;
  center?: string;
  next_dose_date?: string;
}

// Tipo auxiliar para payload (lo que enviamos al backend)
export interface PatientVaccinationPayload {
  patient: number;
  vaccine: number; // solo el ID
  dose_number: number;
  date_administered: string;
  lot?: string;
  center?: string;
  next_dose_date?: string;
}

// Paginación institucional para esquemas
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export function useVaccinations(patientId: number) {
  // Dosis aplicadas (backend devuelve objetos con vaccine_detail)
  const vaccinations = useQuery<PatientVaccination[]>({
    queryKey: ["vaccinations", patientId],
    queryFn: () =>
      apiFetch(`patient-vaccinations/?patient=${patientId}`),
  });

  // Esquema teórico SVPP (puede venir paginado o como array plano)
  const schedule = useQuery<VaccinationSchedule[] | Paginated<VaccinationSchedule>>({
    queryKey: ["vaccination-schedule", "Venezuela"],
    queryFn: () =>
      apiFetch(`vaccination-schedule/?country=Venezuela`),
  });

  // Crear dosis aplicada
  const create = useMutation({
    mutationFn: (data: PatientVaccinationPayload) =>
      apiFetch("patient-vaccinations/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  });

  // Actualizar dosis aplicada
  const update = useMutation({
    mutationFn: (data: PatientVaccinationPayload & { id: number }) =>
      apiFetch(`patient-vaccinations/${data.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
  });

  // Eliminar dosis aplicada
  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`patient-vaccinations/${id}/`, {
        method: "DELETE",
      }),
  });

  return { vaccinations, schedule, create, update, remove };
}
