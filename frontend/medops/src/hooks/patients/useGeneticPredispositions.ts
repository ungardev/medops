// src/hooks/patients/useGeneticPredispositions.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";

export interface GeneticPredisposition {
  id: number;
  name: string;
  description?: string;
}

/**
 * Fetch institucional con blindaje:
 * - Soporta arrays directos
 * - Soporta paginación DRF (data.results)
 * - Soporta respuestas inesperadas sin romper la UI
 * - Ordena alfabéticamente para consistencia visual
 */
async function fetchGeneticPredispositions(): Promise<GeneticPredisposition[]> {
  const data = await apiFetch<any>("genetic-predispositions/");

  // 🔥 Caso 1: backend devuelve array directo
  if (Array.isArray(data)) {
    return data
      .slice()
      .sort((a: GeneticPredisposition, b: GeneticPredisposition) =>
        a.name.localeCompare(b.name)
      );
  }

  // 🔥 Caso 2: backend devuelve paginación DRF
  if (Array.isArray(data?.results)) {
    return data.results
      .slice()
      .sort((a: GeneticPredisposition, b: GeneticPredisposition) =>
        a.name.localeCompare(b.name)
      );
  }

  // 🔥 Caso 3: respuesta inesperada → no romper UI
  console.error("Respuesta inesperada del catálogo genético:", data);
  return [];
}

/**
 * Hook institucional para obtener el catálogo de predisposiciones genéticas.
 * - Cacheado 5 minutos
 * - Sin refetch agresivo al cambiar de pestaña
 * - Blindado contra respuestas inesperadas
 */
export function useGeneticPredispositions() {
  return useQuery<GeneticPredisposition[], Error>({
    queryKey: ["genetic-predispositions"],
    queryFn: fetchGeneticPredispositions,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
  });
}
