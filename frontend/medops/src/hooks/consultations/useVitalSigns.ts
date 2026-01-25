// src/hooks/consultations/useVitalSigns.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VitalSigns, CreateVitalSignsInput, UpdateVitalSignsInput } from "../../types/clinical";
import { getVitalSigns, createVitalSigns, updateVitalSigns, deleteVitalSigns } from "../../api/vitalSigns";
// 🔹 Obtener signos vitales de una cita
export function useVitalSigns(appointmentId: number) {
  return useQuery<VitalSigns, Error>({
    queryKey: ["vital-signs", appointmentId],
    queryFn: async () => getVitalSigns(appointmentId),
    staleTime: 1000 * 60 * 5, // 5 minutos
    enabled: !!appointmentId,
  });
}
// 🔹 Crear signos vitales
export function useCreateVitalSigns(appointmentId: number) {
  const queryClient = useQueryClient();
  
  return useMutation<VitalSigns, Error, CreateVitalSignsInput>({
    mutationFn: (data) => createVitalSigns(appointmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vital-signs", appointmentId] });
      queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
    },
  });
}
// 🔹 Actualizar signos vitales
export function useUpdateVitalSigns(vitalSignsId?: number, appointmentId?: number) {
  const queryClient = useQueryClient();
  
  return useMutation<VitalSigns, Error, UpdateVitalSignsInput>({
    mutationFn: (data) => updateVitalSigns(vitalSignsId!, data),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["vital-signs"] });
      if (appointmentId) {
        queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
      }
    },
  });
}
// 🔹 Eliminar signos vitales
export function useDeleteVitalSigns(appointmentId?: number) {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, number>({
    mutationFn: deleteVitalSigns,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vital-signs"] });
      if (appointmentId) {
        queryClient.invalidateQueries({ queryKey: ["appointment", "current"] });
      }
    },
  });
}