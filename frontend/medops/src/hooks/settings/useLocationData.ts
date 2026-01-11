// src/hooks/settings/useLocationData.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Country, State, Municipality, Parish, Neighborhood } from "@/types/config";

export function useLocationData() {
  const sanitize = (id: any): string | null => {
    if (!id || id === "undefined" || id === "null") return null;
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

  // 🔹 Estados: /api/states/?country=1
  const useStates = (countryId?: any) => {
    const cleanId = sanitize(countryId);
    return useQuery({
      queryKey: ["geo", "states", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        const res = await api.get<State[]>(`states/?country=${cleanId}`);
        return res.data;
      },
      enabled: !!cleanId,
      staleTime: Infinity,
    });
  };

  // 🔹 Municipios: /api/municipalities/?state=1
  const useMunicipalities = (stateId?: any) => {
    const cleanId = sanitize(stateId);
    return useQuery({
      queryKey: ["geo", "municipalities", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        const res = await api.get<Municipality[]>(`municipalities/?state=${cleanId}`);
        return res.data;
      },
      enabled: !!cleanId,
      staleTime: Infinity,
    });
  };

  // 🔹 Parroquias: /api/parishes/?municipality=1
  const useParishes = (municipalityId?: any) => {
    const cleanId = sanitize(municipalityId);
    return useQuery({
      queryKey: ["geo", "parishes", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        const res = await api.get<Parish[]>(`parishes/?municipality=${cleanId}`);
        return res.data;
      },
      enabled: !!cleanId,
      staleTime: Infinity,
    });
  };

  // 🔹 Urbanizaciones: /api/neighborhoods/?parish=1
  const useNeighborhoods = (parishId?: any) => {
    const cleanId = sanitize(parishId);
    return useQuery({
      queryKey: ["geo", "neighborhoods", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        const res = await api.get<Neighborhood[]>(`neighborhoods/?parish=${cleanId}`);
        return res.data;
      },
      enabled: !!cleanId,
      staleTime: Infinity,
    });
  };

  // 🔹 Crear Nueva Urbanización (POST)
  // Corregido: Se usa 'parish_id' para coincidir con la validación del backend
  const createNeighborhood = async (name: string, parishId: number) => {
    const res = await api.post<Neighborhood>("neighborhoods/", {
      name: name.trim(),
      parish_id: Number(parishId) // ⚡ Cambio clave aquí
    });
    return res.data;
  };

  return { 
    useCountries, 
    useStates, 
    useMunicipalities, 
    useParishes, 
    useNeighborhoods,
    createNeighborhood 
  };
}
