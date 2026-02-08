// src/hooks/settings/useLocationData.ts
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { Country, State, Municipality, Parish, Neighborhood } from "@/types/config";
import usePaginatedData from "../helpers/usePaginatedData";
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
  // 🔹 Países: /api/countries/ - NUEVA ESTRATEGIA DE FETCH ALL
  const useCountries = () => {
    const result = usePaginatedData<Country>({
      endpoint: "countries/",
      enabled: true,
      maxPages: 50, // Reducido para countries (solo 1 página esperada)
      timeout: 15000 // 15 segundos
    });
    
    console.log('🔍 useCountries result:', {
      dataCount: result.data?.length || 0,
      totalCount: result.totalCount,
      isLoading: result.isLoading,
      isLoadingPages: result.isLoadingPages
    });
    
    return result;
  };
  // 🔹 Estados: /api/states/?country=1 - NUEVA ESTRATEGIA
  const useStates = (countryId?: any) => {
    const cleanId = sanitize(countryId);
    const result = usePaginatedData<State>({
      endpoint: "states/",
      enabled: !!cleanId,
      queryParams: cleanId ? { country: cleanId } : {},
      maxPages: 100, // Venezuela tiene ~25 estados, pero permitimos hasta 100
      timeout: 20000 // 20 segundos
    });
    
    console.log('🔍 useStates result:', {
      countryId: cleanId,
      dataCount: result.data?.length || 0,
      totalCount: result.totalCount,
      isLoading: result.isLoading
    });
    
    return result;
  };
  // 🔹 Municipios: /api/municipalities/?state=1 - NUEVA ESTRATEGIA
  const useMunicipalities = (stateId?: any) => {
    const cleanId = sanitize(stateId);
    const result = usePaginatedData<Municipality>({
      endpoint: "municipalities/",
      enabled: !!cleanId,
      queryParams: cleanId ? { state: cleanId } : {},
      maxPages: 200, // Algunos estados tienen muchos municipios
      timeout: 25000 // 25 segundos
    });
    
    console.log('🔍 useMunicipalities result:', {
      stateId: cleanId,
      dataCount: result.data?.length || 0,
      totalCount: result.totalCount,
      isLoading: result.isLoading
    });
    
    return result;
  };
  // 🔹 Parroquias: /api/parishes/?municipality=1 - NUEVA ESTRATEGIA
  const useParishes = (municipalityId?: any) => {
    const cleanId = sanitize(municipalityId);
    const result = usePaginatedData<Parish>({
      endpoint: "parishes/",
      enabled: !!cleanId,
      queryParams: cleanId ? { municipality: cleanId } : {},
      maxPages: 300, // Algunos municipios tienen muchas parroquias
      timeout: 25000 // 25 segundos
    });
    
    console.log('🔍 useParishes result:', {
      municipalityId: cleanId,
      dataCount: result.data?.length || 0,
      totalCount: result.totalCount,
      isLoading: result.isLoading
    });
    
    return result;
  };
  // 🔹 Urbanizaciones: /api/neighborhoods/?parish=1 - NUEVA ESTRATEGIA
  const useNeighborhoods = (parishId?: any) => {
    const cleanId = sanitize(parishId);
    const result = usePaginatedData<Neighborhood>({
      endpoint: "neighborhoods/",
      enabled: !!cleanId,
      queryParams: cleanId ? { parish: cleanId } : {},
      maxPages: 500, // Barrios puede ser muy numerosos
      timeout: 30000 // 30 segundos
    });
    
    console.log('🔍 useNeighborhoods result:', {
      parishId: cleanId,
      dataCount: result.data?.length || 0,
      totalCount: result.totalCount,
      isLoading: result.isLoading
    });
    
    return result;
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