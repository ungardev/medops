// src/hooks/core/useDoctorSearch.ts
import { useState, useEffect } from "react";
import { apiFetch } from "@/api/client";

interface DoctorSearchResult {
  id: number;
  full_name: string;
  gender: string;
  is_verified: boolean;
  colegiado_id: string;
  license: string;
  specialties: { id: number; name: string }[];
  institutions: { id: number; name: string }[];
  institution_name: string | null;
  email: string;
  phone: string;
  bio: string;
  photo_url: string | null;
}

interface DoctorSearchResponse {
  count: number;
  results: DoctorSearchResult[];
}

export function useDoctorSearch(query: string) {
  const [results, setResults] = useState<DoctorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchDoctors = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<DoctorSearchResponse>(
          `patient-search/doctors/?q=${encodeURIComponent(query)}`
        );
        setResults(data.results || []);
      } catch (err: any) {
        console.error("Error searching doctors:", err);
        setError(err.message || "Error al buscar doctores");
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimeout = setTimeout(searchDoctors, 300);
    return () => clearTimeout(debounceTimeout);
  }, [query]);

  return { results, loading, error };
}