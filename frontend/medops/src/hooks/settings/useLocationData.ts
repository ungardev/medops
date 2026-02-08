// src/hooks/settings/useLocationData.ts
import React from 'react';
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
  // 🔹 Países: /api/countries/ - CORREGIDO PARA EXTRAER RESULTS
  const useCountries = () => useQuery({
    queryKey: ["geo", "countries"],
    queryFn: async () => {
      console.log('🔍 Fetching countries...');
      const res = await api.get<{results: Country[], count: number}>("countries/");
      console.log('🔍 Countries response:', res.data);
      console.log('🔍 Countries results extracted:', res.data.results);
      return res.data.results; // ← FIX: Extraer results de estructura paginada
    },
    staleTime: 1000, // 1 segundo para debugging
    gcTime: 1000, // 1 segundo para debugging
  });
  // 🔹 Estados: /api/states/?country=1 - CORREGIDO PARA EXTRAER RESULTS
  const useStates = (countryId?: any) => {
    const cleanId = sanitize(countryId);
    return useQuery({
      queryKey: ["geo", "states", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        console.log('🔍 Fetching states for country:', cleanId);
        const res = await api.get<{results: State[], count: number}>(`states/?country=${cleanId}`);
        console.log('🔍 States response:', res.data);
        console.log('🔍 States results extracted:', res.data.results);
        return res.data.results; // ← FIX: Extraer results de estructura paginada
      },
      enabled: !!cleanId,
      staleTime: 1000, // 1 segundo para debugging
      gcTime: 1000, // 1 segundo para debugging
    });
  };
  // 🔹 Municipios: /api/municipalities/?state=1 - CORREGIDO PARA EXTRAER RESULTS
  const useMunicipalities = (stateId?: any) => {
    const cleanId = sanitize(stateId);
    return useQuery({
      queryKey: ["geo", "municipalities", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        console.log('🔍 Fetching municipalities for state:', cleanId);
        const res = await api.get<{results: Municipality[], count: number}>(`municipalities/?state=${cleanId}`);
        console.log('🔍 Municipalities response:', res.data);
        console.log('🔍 Municipalities results extracted:', res.data.results);
        return res.data.results; // ← FIX: Extraer results de estructura paginada
      },
      enabled: !!cleanId,
      staleTime: 1000, // 1 segundo para debugging
      gcTime: 1000, // 1 segundo para debugging
    });
  };
  // 🔹 Parroquias: /api/parishes/?municipality=1 - CORREGIDO PARA EXTRAER RESULTS
  const useParishes = (municipalityId?: any) => {
    const cleanId = sanitize(municipalityId);
    return useQuery({
      queryKey: ["geo", "parishes", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        const res = await api.get<{results: Parish[], count: number}>(`parishes/?municipality=${cleanId}`);
        console.log('🔍 Parishes response:', res.data);
        console.log('🔍 Parishes results extracted:', res.data.results);
        return res.data.results; // ← FIX: Extraer results de estructura paginada
      },
      enabled: !!cleanId,
      staleTime: 1000, // 1 segundo para debugging
      gcTime: 1000, // 1 segundo para debugging
    });
  };
  // 🔹 Urbanizaciones: /api/neighborhoods/?parish=1 - CORREGIDO PARA EXTRAER RESULTS
  const useNeighborhoods = (parishId?: any) => {
    const cleanId = sanitize(parishId);
    return useQuery({
      queryKey: ["geo", "neighborhoods", cleanId],
      queryFn: async () => {
        if (!cleanId) return [];
        const res = await api.get<{results: Neighborhood[], count: number}>(`neighborhoods/?parish=${cleanId}`);
        console.log('🔍 Neighborhoods response:', res.data);
        console.log('🔍 Neighborhoods results extracted:', res.data.results);
        return res.data.results; // ← FIX: Extraer results de estructura paginada
      },
      enabled: !!cleanId,
      staleTime: 1000, // 1 segundo para debugging
      gcTime: 1000, // 1 segundo para debugging
    });
  };
  // 🔹 Crear Nueva Urbanización (POST) - SIN CAMBIOS
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