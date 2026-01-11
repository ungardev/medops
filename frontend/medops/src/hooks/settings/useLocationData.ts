// src/hooks/settings/useLocationData.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { 
  Country, State, Municipality, Parish, Neighborhood 
} from "@/types/config";

/**
 * Hook de Élite para la gestión de data geográfica en cascada.
 * Corregido para usar las rutas reales del Backend (sin el prefijo 'core/').
 */
export function useLocationData() {
  
  /**
   * 🛡️ Purificador de IDs "Anti-Corrupción"
   */
  const sanitize = (id: string | number | null | undefined): string | null => {
    if (id === null || id === undefined || id === "" || id === "undefined" || id === "null") {
      return null;
    }
    const cleanId = String(id).replace(/[^0-9]/g, '');
    return cleanId !== '' ? cleanId : null;
  };

  // 🔹 Obtener Países: /api/countries/
  const useCountries = () => useQuery({
    queryKey: ["geo", "countries"],
    queryFn: async () => {
      // ✅ ELIMINADO 'core/' - Ruta real confirmada por prueba de navegador
      const res = await api.get<Country[]>("countries/");
      return res.data;
    },
    staleTime: Infinity,
  });

  // 🔹 Obtener Estados por País: /api/countries/{id}/states/
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

  // 🔹 Obtener Municipios por Estado: /api/states/{id}/municipalities/
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

  // 🔹 Obtener Parroquias por Municipio: /api/municipalities/{id}/parishes/
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

  // 🔹 Obtener Urbanizaciones por Parroquia: /api/parishes/{id}/neighborhoods/
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
    useCountries,
    useStates,
    useMunicipalities,
    useParishes,
    useNeighborhoods,
  };
}
