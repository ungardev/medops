// src/hooks/settings/useLocationData.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { 
  Country, State, Municipality, Parish, Neighborhood 
} from "@/types/config";

/**
 * Hook de Élite para la gestión de data geográfica en cascada.
 * Blindado contra parámetros corruptos mediante sanitización por Regex 
 * y optimizado con caché persistente (staleTime: Infinity).
 */
export function useLocationData() {
  
  /**
   * 🛡️ Purificador de IDs "Anti-Corrupción"
   * Elimina cualquier carácter que no sea numérico (adiós a ":1", "id:1", etc.)
   */
  const sanitize = (id: string | number | null | undefined): string | null => {
    if (id === null || id === undefined || id === "" || id === "undefined" || id === "null") {
      return null;
    }
    // Regex: Mantiene solo dígitos. Si el resultado es vacío, retorna null.
    const cleanId = String(id).replace(/[^0-9]/g, '');
    return cleanId !== '' ? cleanId : null;
  };

  // 🔹 Obtener Países (Base de la cadena)
  const useCountries = () => useQuery({
    queryKey: ["geo", "countries"],
    queryFn: async () => {
      // URL limpia sin parámetros para evitar herencia de basura
      const res = await api.get<Country[]>("core/countries/");
      return res.data;
    },
    staleTime: Infinity,
  });

  // 🔹 Obtener Estados por País
  const useStates = (countryId?: string | number | null) => {
    const cleanId = sanitize(countryId);
    return useQuery({
      queryKey: ["geo", "states", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        const res = await api.get<State[]>(`core/countries/${cleanId}/states/`);
        return res.data;
      },
      // Solo se activa si el ID sanitizado existe
      enabled: cleanId !== null,
      staleTime: Infinity,
    });
  };

  // 🔹 Obtener Municipios por Estado
  const useMunicipalities = (stateId?: string | number | null) => {
    const cleanId = sanitize(stateId);
    return useQuery({
      queryKey: ["geo", "municipalities", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        const res = await api.get<Municipality[]>(`core/states/${cleanId}/municipalities/`);
        return res.data;
      },
      enabled: cleanId !== null,
      staleTime: Infinity,
    });
  };

  // 🔹 Obtener Parroquias por Municipio
  const useParishes = (municipalityId?: string | number | null) => {
    const cleanId = sanitize(municipalityId);
    return useQuery({
      queryKey: ["geo", "parishes", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        const res = await api.get<Parish[]>(`core/municipalities/${cleanId}/parishes/`);
        return res.data;
      },
      enabled: cleanId !== null,
      staleTime: Infinity,
    });
  };

  // 🔹 Obtener Urbanizaciones por Parroquia
  const useNeighborhoods = (parishId?: string | number | null) => {
    const cleanId = sanitize(parishId);
    return useQuery({
      queryKey: ["geo", "neighborhoods", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        const res = await api.get<Neighborhood[]>(`core/parishes/${cleanId}/neighborhoods/`);
        return res.data;
      },
      enabled: cleanId !== null,
      staleTime: Infinity,
    });
  };

  return {
    useCountries,
    useStates,
    useMunicipalities,
    useParishes,
    useNeighborhoods,
  };
}
