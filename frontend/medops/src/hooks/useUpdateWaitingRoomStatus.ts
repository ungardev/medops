// src/hooks/useUpdateWaitingRoomStatus.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/apiClient";

export function useUpdateWaitingRoomStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { data } = await api.patch(`/waitingroom/${id}/status/`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitingroomGroupsToday"] });
    },
  });
}
