// src/hooks/consultations/useSpecialties.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { useEffect, useState } from "react";
import type { Specialty } from "../../types/consultation";

// 🔹 Hook de debounce para evitar saturar el backend
function useDebouncedValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// 🔹 Hook principal para buscar especialidades médicas
export function useSpecialties(search?: string) {
  const debounced = useDebouncedValue(search || "", 300);
  const query = debounced.trim();

  return useQuery<Specialty[], Error>({
    queryKey: ["specialties", query],
    queryFn: async () => {
      // 🔹 Si hay texto, usamos ?q=...; si no, precargamos todo
      const endpoint = query.length >= 1
        ? `choices/specialty/?q=${encodeURIComponent(query)}`
        : `choices/specialty/`;

      const data = await apiFetch<Specialty[]>(endpoint);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 1000 * 60 * 5, // cache por 5 minutos
    placeholderData: (prev) => prev, // mantiene datos previos mientras carga
  });
}
