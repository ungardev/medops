// src/hooks/settings/useLocationData.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { 
  Country, State, Municipality, Parish, Neighborhood 
} from "@/types/config";

export function useLocationData() {
  
  /**
   * 🛡️ Purificador de IDs
   * Extrae solo los números. Si recibe ":1", devuelve "1".
   */
  const sanitize = (id: string | number | null | undefined): string | null => {
    if (id === null || id === undefined || id === "" || id === "undefined" || id === "null") {
      return null;
    }
    const cleanId = String(id).replace(/[^0-9]/g, '');
    return cleanId !== '' ? cleanId : null;
  };

  // 🔹 Países: /api/countries/
  const useCountries = () => useQuery({
    queryKey: ["geo", "countries"],
    queryFn: async () => {
      const res = await api.get<Country[]>("countries/");
      return res.data;
    },
    staleTime: Infinity,
  });

  // 🔹 Estados: /api/countries/{id}/states/
  const useStates = (countryId?: string | number | null) => {
    const cleanId = sanitize(countryId);
    return useQuery({
      queryKey: ["geo", "states", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        const res = await api.get<State[]>(`countries/${cleanId}/states/`);
        return res.data;
      },
      enabled: cleanId !== null,
      staleTime: Infinity,
    });
  };

  // 🔹 Municipios: /api/states/{id}/municipalities/
  const useMunicipalities = (stateId?: string | number | null) => {
    const cleanId = sanitize(stateId);
    return useQuery({
      queryKey: ["geo", "municipalities", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        const res = await api.get<Municipality[]>(`states/${cleanId}/municipalities/`);
        return res.data;
      },
      enabled: cleanId !== null,
      staleTime: Infinity,
    });
  };

  // 🔹 Parroquias: /api/municipalities/{id}/parishes/
  const useParishes = (municipalityId?: string | number | null) => {
    const cleanId = sanitize(municipalityId);
    return useQuery({
      queryKey: ["geo", "parishes", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        const res = await api.get<Parish[]>(`municipalities/${cleanId}/parishes/`);
        return res.data;
      },
      enabled: cleanId !== null,
      staleTime: Infinity,
    });
  };

  // 🔹 Urbanizaciones: /api/parishes/{id}/neighborhoods/
  const useNeighborhoods = (parishId?: string | number | null) => {
    const cleanId = sanitize(parishId);
    return useQuery({
      queryKey: ["geo", "neighborhoods", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        const res = await api.get<Neighborhood[]>(`parishes/${cleanId}/neighborhoods/`);
        return res.data;
      },
      enabled: cleanId !== null,
      staleTime: Infinity,
    });
  };

  return {
    useCountries, useStates, useMunicipalities, useParishes, useNeighborhoods,
  };
}
