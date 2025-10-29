// src/hooks/useUpdateWaitingRoomStatus.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export function useUpdateWaitingRoomStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiFetch(`waitingroom/${id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: () => {
      // 🔹 Invalida tanto la lista principal como los grupos
      queryClient.invalidateQueries({ queryKey: ["waitingRoomEntriesToday"] });
      queryClient.invalidateQueries({ queryKey: ["waitingroomGroupsToday"] });
    },
  });
}
