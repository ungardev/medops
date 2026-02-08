// src/hooks/settings/useLocationData.ts
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
  const useCountries = () => {
    return usePaginatedData<Country>({
      endpoint: "countries/",
      enabled: true,
      maxPages: 10,
      timeout: 15000
    });
  };
  const useStates = (countryId?: any) => {
    const cleanId = sanitize(countryId);
    return usePaginatedData<State>({
      endpoint: "states/",
      enabled: !!cleanId,
      queryParams: cleanId ? { country_id: Number(cleanId) } : {},
      // ✅ FILTRAR POR COUNTRY_ID
      filterFn: (state, params) => {
        return (state as any).country?.id === params.country_id;
      },
      maxPages: 50,
      timeout: 20000
    });
  };
  const useMunicipalities = (stateId?: any) => {
    const cleanId = sanitize(stateId);
    return usePaginatedData<Municipality>({
      endpoint: "municipalities/",
      enabled: !!cleanId,
      queryParams: cleanId ? { state_id: Number(cleanId) } : {},
      // ✅ FILTRAR POR STATE_ID
      filterFn: (municipality, params) => {
        return (municipality as any).state?.id === params.state_id;
      },
      maxPages: 100,
      timeout: 25000
    });
  };
  const useParishes = (municipalityId?: any) => {
    const cleanId = sanitize(municipalityId);
    return usePaginatedData<Parish>({
      endpoint: "parishes/",
      enabled: !!cleanId,
      queryParams: cleanId ? { municipality_id: Number(cleanId) } : {},
      // ✅ FILTRAR POR MUNICIPALITY_ID
      filterFn: (parish, params) => {
        return (parish as any).municipality?.id === params.municipality_id;
      },
      maxPages: 100,
      timeout: 25000
    });
  };
  const useNeighborhoods = (parishId?: any) => {
    const cleanId = sanitize(parishId);
    return usePaginatedData<Neighborhood>({
      endpoint: "neighborhoods/",
      enabled: !!cleanId,
      queryParams: cleanId ? { parish_id: Number(cleanId) } : {},
      // ✅ FILTRAR POR PARISH_ID
      filterFn: (neighborhood, params) => {
        return (neighborhood as any).parish?.id === params.parish_id;
      },
      maxPages: 200,
      timeout: 30000
    });
  };
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