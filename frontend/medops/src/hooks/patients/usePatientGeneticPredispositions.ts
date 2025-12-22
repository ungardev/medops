// src/hooks/patients/usePatientGeneticPredispositions.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export interface PatientGeneticPredisposition {
  id: number;
  patient: number;
  predisposition: number; // id de la predisposición genética del catálogo
  notes?: string;
}

export function usePatientGeneticPredispositions(patientId: number) {
  const queryClient = useQueryClient();
  const listKey = ["patient-genetic-predispositions", patientId];

  // --- Listar predisposiciones genéticas del paciente ---
  const query = useQuery({
    queryKey: listKey,
    queryFn: () =>
      apiFetch(`patient-genetic-predispositions/?patient=${patientId}`),
  });

  // --- Crear predisposición genética del paciente ---
  const create = useMutation({
    mutationFn: (data: Omit<PatientGeneticPredisposition, "id" | "patient">) =>
      apiFetch("patient-genetic-predispositions/", {
        method: "POST",
        body: JSON.stringify({ ...data, patient: patientId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  // --- Actualizar predisposición genética del paciente ---
  const update = useMutation({
    mutationFn: (data: PatientGeneticPredisposition) =>
      apiFetch(`patient-genetic-predispositions/${data.id}/`, {
        method: "PUT",
        body: JSON.stringify({ ...data, patient: patientId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  // --- Eliminar predisposición genética del paciente ---
  const remove = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`patient-genetic-predispositions/${id}/`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  return { query, create, update, remove };
}
