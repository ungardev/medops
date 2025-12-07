// src/hooks/settings/useSpecialtyChoices.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";  // ⚔️ Cliente institucional

export function useSpecialtyChoices() {
  return useQuery({
    queryKey: ["specialty-choices"],
    queryFn: async () => {
      const res = await api.get("/choices/specialty/");
      return res.data; // [{id, code, name}]
    },
  });
}
