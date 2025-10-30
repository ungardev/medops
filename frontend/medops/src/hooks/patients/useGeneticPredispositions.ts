// src/hooks/patients/useGeneticPredispositions.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export interface GeneticPredisposition {
  id: number;
  name: string;
  description?: string;
}

async function fetchGeneticPredispositions(): Promise<GeneticPredisposition[]> {
  return apiFetch<GeneticPredisposition[]>("genetic-predispositions/");
}

export function useGeneticPredispositions() {
  return useQuery<GeneticPredisposition[], Error>({
    queryKey: ["genetic-predispositions"],
    queryFn: fetchGeneticPredispositions,
    staleTime: 5 * 60 * 1000, // cache 5 minutos
    refetchOnWindowFocus: false,
  });
}
