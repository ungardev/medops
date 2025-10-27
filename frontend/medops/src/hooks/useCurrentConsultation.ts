// src/hooks/useCurrentConsultation.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";
import type { paths } from "../types/api";

type CurrentConsultationResponse =
  paths["/api/consultation/current/"]["get"]["responses"]["200"]["content"]["application/json"];

export function useCurrentConsultation() {
  return useQuery({
    queryKey: ["currentConsultation"],
    queryFn: async (): Promise<CurrentConsultationResponse> => {
      const { data } = await api.get<CurrentConsultationResponse>("/consultation/current/");
      return data;
    },
    retry: false,
  });
}
