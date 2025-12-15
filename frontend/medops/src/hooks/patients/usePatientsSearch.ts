import { useEffect, useState } from "react";
import { apiFetch } from "@/api/client";
import { Patient } from "@/types/patients";

const DEBOUNCE_MS = 250;

export function usePatientsSearch(query: string) {
  const [data, setData] = useState<Patient[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;

    const run = async () => {
      const q = query.trim();

      if (q.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await apiFetch<Patient[]>(
          `/patients/search/?q=${encodeURIComponent(q)}`
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
