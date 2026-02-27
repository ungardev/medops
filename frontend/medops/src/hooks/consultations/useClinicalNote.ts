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
// Obtener nota clínica de una cita
export function useClinicalNote(appointmentId: number) {
  return useQuery<ClinicalNote, Error>({
    queryKey: ["clinical-note", appointmentId],
    queryFn: async () => getClinicalNote(appointmentId),
    staleTime: 1000 * 60 * 5,
    enabled: !!appointmentId,
  });
}
// Crear nota clínica (CORREGIDO: pasa appointmentId en los datos)
export function useCreateClinicalNote() {
  const queryClient = useQueryClient();
  
  return useMutation<ClinicalNote, Error, CreateClinicalNoteInput>({
    mutationFn: (data) => createClinicalNote(data.appointment, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clinical-note", variables.appointment] });
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
}
// Actualizar nota clínica (CORREGIDO: solo necesita appointmentId)
export function useUpdateClinicalNote(appointmentId?: number) {
  const queryClient = useQueryClient();
  
  return useMutation<ClinicalNote, Error, UpdateClinicalNoteInput>({
    mutationFn: (data) => updateClinicalNote(appointmentId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-note"] });
      if (appointmentId) {
        queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
      }
    },
  });
}
// Bloquear nota clínica (CORREGIDO: usa appointmentId)
export function useLockClinicalNote(appointmentId?: number) {
  const queryClient = useQueryClient();
  
  return useMutation<ClinicalNote, Error, void>({
    mutationFn: () => lockClinicalNote(appointmentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-note"] });
    },
  });
}
// Desbloquear nota clínica (CORREGIDO: usa appointmentId)
export function useUnlockClinicalNote(appointmentId?: number) {
  const queryClient = useQueryClient();
  
  return useMutation<ClinicalNote, Error, void>({
    mutationFn: () => unlockClinicalNote(appointmentId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinical-note"] });
    },
  });
}