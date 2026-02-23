// src/hooks/appointments/useAppointmentsSearch.ts
import { useEffect, useState } from "react";
import { apiFetch } from "@/api/client";
import { Appointment } from "@/types/appointments";
import { mapAppointmentList } from "@/utils/appointmentsMapper";
const DEBOUNCE_MS = 250;
export function useAppointmentsSearch(query: string) {
  const [data, setData] = useState<Appointment[]>([]);
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
        const rawResults = await apiFetch<any[]>(
          `/appointments/search/?q=${encodeURIComponent(q)}`
        );
        if (!stop) {
          // ✅ APLICAR MAPPER A LOS RESULTADOS
          const mappedResults = Array.isArray(rawResults)
            ? rawResults.map(mapAppointmentList)
            : [];
          setData(mappedResults);
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