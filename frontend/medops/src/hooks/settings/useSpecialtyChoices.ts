// src/hooks/settings/useSpecialtyChoices.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import type { Specialty } from "@/types/config";

export function useSpecialtyChoices() {
  return useQuery<Specialty[]>({
    queryKey: ["specialty-choices"],

    // ✅ Query principal
    queryFn: async () => {
      console.log("FETCH SPECIALTY CHOICES >>> ejecutando queryFn");

      const res = await api.get("/choices/specialty/");
      const data = res.data as Specialty[];

      // ✅ Deduplicación defensiva por ID
      const deduped = data.filter(
        (s, i, self) => self.findIndex((x) => x.id === s.id) === i
      );

      console.log("SPECIALTY CHOICES RAW >>>", data.map((s) => s.id));
      console.log("SPECIALTY CHOICES DEDUPED >>>", deduped.map((s) => s.id));

      return deduped;
    },

    // ✅ Blindaje institucional contra re-fetches innecesarios
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 2, // 2 horas

    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,

    // ✅ Evita que React Query re-renderice si la data no cambió
    structuralSharing: true,
  });
}
