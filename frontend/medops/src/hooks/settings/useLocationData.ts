// src/hooks/settings/useLocationData.ts
import React from 'react'; // ← LÍNEA FALTANTE
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Country, State, Municipality, Parish, Neighborhood } from "@/types/config";
export function useLocationData() {
  const sanitize = (id: any): string | null => {
    if (!id || id === "undefined" || id === "null") return null;
    const cleanId = String(id).replace(/[^0-9]/g, '');
    return cleanId !== '' ? cleanId : null;
  };
  // DEBUGGING TEMPORAL - Verificar token actual
  React.useEffect(() => {
    console.log('🔍 Current Token:', import.meta.env.VITE_DEV_TOKEN);
    console.log('🔍 API Base URL:', import.meta.env.VITE_API_URL);
  }, []);
  // 🔹 Países: /api/countries/ - SIN CACHÉ TEMPORALMENTE
  const useCountries = () => useQuery({
    queryKey: ["geo", "countries"],
    queryFn: async () => {
      console.log('🔍 Fetching countries...');
      const res = await api.get<Country[]>("countries/");
      console.log('🔍 Countries response:', res.data);
      return res.data;
    },
    staleTime: 1000, // 1 segundo para debugging
    gcTime: 1000, // 1 segundo para debugging
  });
  // 🔹 Estados: /api/states/?country=1
  const useStates = (countryId?: any) => {
    const cleanId = sanitize(countryId);
    return useQuery({
      queryKey: ["geo", "states", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        console.log('🔍 Fetching states for country:', cleanId);
        const res = await api.get<State[]>(`states/?country=${cleanId}`);
        console.log('🔍 States response:', res.data);
        return res.data;
      },
      enabled: !!cleanId,
      staleTime: 1000, // 1 segundo para debugging
      gcTime: 1000, // 1 segundo para debugging
    });
  };
  // 🔹 Municipios: /api/municipalities/?state=1
  const useMunicipalities = (stateId?: any) => {
    const cleanId = sanitize(stateId);
    return useQuery({
      queryKey: ["geo", "municipalities", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        console.log('🔍 Fetching municipalities for state:', cleanId);
        const res = await api.get<Municipality[]>(`municipalities/?state=${cleanId}`);
        return res.data;
      },
      enabled: !!cleanId,
      staleTime: 1000, // 1 segundo para debugging
      gcTime: 1000, // 1 segundo para debugging
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
      staleTime: 1000, // 1 segundo para debugging
      gcTime: 1000, // 1 segundo para debugging
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
      staleTime: 1000, // 1 segundo para debugging
      gcTime: 1000, // 1 segundo para debugging
    });
  };
  // 🔹 Crear Nueva Urbanización (POST)
  const createNeighborhood = async (name: string, parishId: number) => {
    const res = await api.post<Neighborhood>("neighborhoods/", {
      name: name.trim(),
      parish_id: Number(parishId)
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