// src/hooks/consultations/useUpdateMedicalReferral.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { MedicalReferral } from "../../types/consultation";

// 👇 endpoint relativo, sin /api
const API_URL = "medical-referrals/";

export function useUpdateMedicalReferral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, appointment, ...payload }: Partial<MedicalReferral> & { id: number; appointment: number }) => {
      // 🔹 aseguramos que specialty_ids siempre se envíe como array
      const finalPayload = {
        ...payload,
        specialty_ids: payload.specialty_ids ?? [],
      };

      const { data } = await axios.patch<MedicalReferral>(`${API_URL}${id}/`, finalPayload);
      return data;
    },
    onSuccess: (_, variables) => {
      // 🔹 invalidamos cache para refrescar listado de referencias del appointment
      queryClient.invalidateQueries({
        queryKey: ["medical-referrals", variables.appointment],
      });
    },
  });
}
