// src/hooks/settings/useLocationData.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { 
  Country, State, Municipality, Parish, Neighborhood 
} from "@/types/config";

/**
 * Hook para gestionar la data geográfica en cascada.
 * Implementa cache persistente (staleTime: Infinity) para optimizar la navegación.
 */
export function useLocationData() {
  
  // 🔹 Obtener Países
  const useCountries = () => useQuery({
    queryKey: ["geo", "countries"],
    queryFn: async () => {
      const res = await api.get<Country[]>("core/countries/");
      return res.data;
    },
    staleTime: Infinity,
  });

  // 🔹 Obtener Estados por País
  const useStates = (countryId?: string | number) => useQuery({
    queryKey: ["geo", "states", countryId],
    queryFn: async () => {
      const res = await api.get<State[]>(`core/countries/${countryId}/states/`);
      return res.data;
    },
    enabled: !!countryId,
    staleTime: Infinity,
  });

  // 🔹 Obtener Municipios por Estado
  const useMunicipalities = (stateId?: string | number) => useQuery({
    queryKey: ["geo", "municipalities", stateId],
    queryFn: async () => {
      const res = await api.get<Municipality[]>(`core/states/${stateId}/municipalities/`);
      return res.data;
    },
    enabled: !!stateId,
    staleTime: Infinity,
  });

  // 🔹 Obtener Parroquias por Municipio
  const useParishes = (municipalityId?: string | number) => useQuery({
    queryKey: ["geo", "parishes", municipalityId],
    queryFn: async () => {
      const res = await api.get<Parish[]>(`core/municipalities/${municipalityId}/parishes/`);
      return res.data;
    },
    enabled: !!municipalityId,
    staleTime: Infinity,
  });

  // 🔹 Obtener Urbanizaciones por Parroquia
  const useNeighborhoods = (parishId?: string | number) => useQuery({
    queryKey: ["geo", "neighborhoods", parishId],
    queryFn: async () => {
      const res = await api.get<Neighborhood[]>(`core/parishes/${parishId}/neighborhoods/`);
      return res.data;
    },
    enabled: !!parishId,
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
