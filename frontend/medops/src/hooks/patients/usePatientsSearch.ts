// src/hooks/patients/usePatientsSearch.ts
import { useEffect, useState } from "react";
import { apiFetch } from "@/api/client";
import { Patient } from "@/types/patients"; // 🔹 ahora usamos Patient completo

interface Paged<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const MAX_RESULTS = 300;   // 🔹 límite institucional para no saturar UI
const PAGE_SIZE = 50;      // 🔹 tamaño de página agresivo para reducir hops
const DEBOUNCE_MS = 250;   // 🔹 debounce para UX fluida

export function usePatientsSearch(query: string) {
  const [data, setData] = useState<Patient[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;

    const run = async () => {
      // 🔹 Ahora permitimos búsqueda desde 1 carácter
      if (!query || query.trim().length === 0) {
        setData([]);
        setLoading(false);
        setExhausted(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const aggregated: Patient[] = [];
        let page: number = 1;
        let next: string | null = `/patients/search/?q=${encodeURIComponent(query.trim())}&page_size=${PAGE_SIZE}&page=${page}`;

        while (next && aggregated.length < MAX_RESULTS && !stop) {
          const pageData: Paged<Patient> = await apiFetch<Paged<Patient>>(next);
          const chunk = Array.isArray(pageData?.results) ? pageData.results : [];
          aggregated.push(...chunk);

          if (pageData.next) {
            page += 1;
            next = `/patients/search/?q=${encodeURIComponent(query.trim())}&page_size=${PAGE_SIZE}&page=${page}`;
          } else {
            next = null;
          }
        }

        if (!stop) {
          setData(aggregated);
          setExhausted(!next); // 🔹 true si ya no hay más páginas
        }
      } catch (err: any) {
        if (!stop) {
          setError(err?.message ?? "Error de búsqueda");
          setData([]);
          setExhausted(false);
        }
      } finally {
        if (!stop) setLoading(false);
      }
    };

    timer = setTimeout(run, DEBOUNCE_MS);
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [query]);

  return {
    data,
    isLoading,
    isError: !!error,
    error,
    exhausted,
    max: MAX_RESULTS,
  };
}
