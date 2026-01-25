// src/hooks/consultations/useClinicalNote.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClinicalNote, CreateClinicalNoteInput, UpdateClinicalNoteInput } from "../../types/clinical";
import { 
  getClinicalNote, 
  createClinicalNote, 
  updateClinicalNote, 
  lockClinicalNote, 
  unlockClinicalNote 
} from "../../api/clinicalNotes";
// 🔹 Obtener nota clínica de una cita
export function useClinicalNote(appointmentId: number) {
  return useQuery<ClinicalNote, Error>({
    queryKey: ["clinical-note", appointmentId],
    queryFn: async () => getClinicalNote(appointmentId),
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!appointmentId,
  });
}
// 🔹 Crear nota clínica
export function useCreateClinicalNote(appointmentId: number) {
  const queryClient = useQueryClient();
  
  return useMutation<ClinicalNote, Error, CreateClinicalNoteInput>({
    mutationFn: (data) => createClinicalNote(appointmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-note", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
}
// 🔹 Actualizar nota clínica
export function useUpdateClinicalNote(clinicalNoteId?: number, appointmentId?: number) {
  const queryClient = useQueryClient();
  
  return useMutation<ClinicalNote, Error, UpdateClinicalNoteInput>({
    mutationFn: (data) => updateClinicalNote(clinicalNoteId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-note"] });
      if (appointmentId) {
        queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
      }
    },
  });
}
// 🔹 Bloquear nota clínica
export function useLockClinicalNote(clinicalNoteId?: number) {
  const queryClient = useQueryClient();
  
  return useMutation<ClinicalNote, Error, void>({
    mutationFn: () => lockClinicalNote(clinicalNoteId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-note"] });
    },
  });
}
// 🔹 Desbloquear nota clínica
export function useUnlockClinicalNote(clinicalNoteId?: number) {
  const queryClient = useQueryClient();
  
  return useMutation<ClinicalNote, Error, void>({
    mutationFn: () => unlockClinicalNote(clinicalNoteId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-note"] });
    },
  });
}