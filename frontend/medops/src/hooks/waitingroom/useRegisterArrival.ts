// src/hooks/waitingroom/useRegisterArrival.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { WaitingRoomEntry } from "../../types/waitingRoom";
import type { OperationalHubData } from "./useOperationalHub";

interface RegisterArrivalPayload {
  patient_id: number;
  patient_full_name?: string;
  appointment_id?: number;
  institution_id: number | null;
  service_id?: number | null;
}

export function useRegisterArrival() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RegisterArrivalPayload): Promise<WaitingRoomEntry> => {
      return apiFetch<WaitingRoomEntry>("waitingroom/register/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    onMutate: async (newEntry: RegisterArrivalPayload) => {
      const institutionId = newEntry.institution_id;

      if (!institutionId) return;

      await queryClient.cancelQueries({ 
        queryKey: ["operationalHub", institutionId] 
      });

      const previousData = queryClient.getQueryData<OperationalHubData>(
        ["operationalHub", institutionId]
      );

      const optimisticEntry: WaitingRoomEntry = {
        id: `temp-${Date.now()}`,
        institution: institutionId,
        patient: { 
          id: newEntry.patient_id, 
          full_name: newEntry.patient_full_name || "Paciente" 
        },
        status: "waiting",
        arrival_time: new Date().toISOString(),
        serviceId: newEntry.service_id ?? undefined,
        source_type: newEntry.appointment_id ? "scheduled" : "walkin",
        priority: "normal",
        order: 0,
        institution_data: null,
      };

      queryClient.setQueryData<OperationalHubData>(
        ["operationalHub", institutionId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            live_queue: [...old.live_queue, optimisticEntry],
          };
        }
      );

      return { previousData, institutionId };
    },

    onError: (err, newEntry, context) => {
      if (context?.previousData && context?.institutionId) {
        queryClient.setQueryData(
          ["operationalHub", context.institutionId],
          context.previousData
        );
      }
    },

    onSettled: (data, error, variables) => {
      if (variables.institution_id) {
        queryClient.invalidateQueries({ 
          queryKey: ["operationalHub", variables.institution_id] 
        });
      }
    },
  });
}