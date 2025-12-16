// src/hooks/appointments/useAppointmentsSearch.ts
import { useEffect, useState } from "react";
import { apiFetch } from "@/api/client";
import { Appointment } from "@/types/appointments";

const DEBOUNCE_MS = 250;

/**
 * 🔍 Hook institucional para búsqueda de citas
 * - Acento-insensible (backend)
 * - Multi-campo: paciente, fecha, tipo, notas, estado
 * - Sin paginación
 * - Máximo 10 resultados
 * - Debounce para UX fluida
 */
export function useAppointmentsSearch(query: string) {
  const [data, setData] = useState<Appointment[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;

    const run = async () => {
      const q = query.trim();

      // Si no hay búsqueda → limpiar resultados
      if (q.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await apiFetch<Appointment[]>(
          `/appointments/search/?q=${encodeURIComponent(q)}`
        );

        if (!stop) {
          setData(Array.isArray(results) ? results : []);
        }
      } catch (err: any) {
        if (!stop) {
          setError(err?.message ?? "Error de búsqueda");
          setData([]);
        }
      } finally {
        if (!stop) setLoading(false);
      }
    };

    // Debounce institucional
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
  };
}
