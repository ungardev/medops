// src/hooks/useRegisterArrival.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

export function useRegisterArrival() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { patient_id: number; appointment_id?: number; is_emergency?: boolean }) => {
      const { data } = await api.post("/waitingroom/register/", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitingroomGroupsToday"] });
    },
  });
}
