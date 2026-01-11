// src/hooks/settings/useLocationData.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { 
  Country, State, Municipality, Parish, Neighborhood 
} from "@/types/config";

/**
 * Hook de Élite para la gestión de data geográfica en cascada.
 * Blindado contra parámetros corruptos y optimizado con caché persistente.
 */
export function useLocationData() {
  
  // 🔹 Obtener Países (Base de la cadena)
  const useCountries = () => useQuery({
    queryKey: ["geo", "countries"],
    queryFn: async () => {
      const res = await api.get<Country[]>("core/countries/");
      return res.data;
    },
    staleTime: Infinity,
  });

  // 🔹 Obtener Estados por País
  const useStates = (countryId?: string | number | null) => useQuery({
    queryKey: ["geo", "states", countryId],
    queryFn: async () => {
      // Validación de seguridad para evitar 404 por basura como ":1"
      if (!countryId || String(countryId).includes(':')) return [];
      const res = await api.get<State[]>(`core/countries/${countryId}/states/`);
      return res.data;
    },
    // Solo se activa si hay un ID real y no es un residuo de string
    enabled: !!countryId && String(countryId) !== "undefined" && !String(countryId).includes(':'),
    staleTime: Infinity,
  });

  // 🔹 Obtener Municipios por Estado
  const useMunicipalities = (stateId?: string | number | null) => useQuery({
    queryKey: ["geo", "municipalities", stateId],
    queryFn: async () => {
      if (!stateId || String(stateId).includes(':')) return [];
      const res = await api.get<Municipality[]>(`core/states/${stateId}/municipalities/`);
      return res.data;
    },
    enabled: !!stateId && String(stateId) !== "undefined" && !String(stateId).includes(':'),
    staleTime: Infinity,
  });

  // 🔹 Obtener Parroquias por Municipio
  const useParishes = (municipalityId?: string | number | null) => useQuery({
    queryKey: ["geo", "parishes", municipalityId],
    queryFn: async () => {
      if (!municipalityId || String(municipalityId).includes(':')) return [];
      const res = await api.get<Parish[]>(`core/municipalities/${municipalityId}/parishes/`);
      return res.data;
    },
    enabled: !!municipalityId && String(municipalityId) !== "undefined" && !String(municipalityId).includes(':'),
    staleTime: Infinity,
  });

  // 🔹 Obtener Urbanizaciones por Parroquia
  const useNeighborhoods = (parishId?: string | number | null) => useQuery({
    queryKey: ["geo", "neighborhoods", parishId],
    queryFn: async () => {
      if (!parishId || String(parishId).includes(':')) return [];
      const res = await api.get<Neighborhood[]>(`core/parishes/${parishId}/neighborhoods/`);
      return res.data;
    },
    enabled: !!parishId && String(parishId) !== "undefined" && !String(parishId).includes(':'),
    staleTime: Infinity,
  });

  return {
    useCountries,
    useStates,
    useMunicipalities,
    useParishes,
    useNeighborhoods,
  };
}
