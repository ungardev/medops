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
      endpoint: `municipalities/${cleanId ? `?state_id=${cleanId}` : ''}`,
      enabled: !!cleanId,
      maxPages: 1,
      timeout: 15000
    });
  };
  const useParishes = (municipalityId?: any) => {
    const cleanId = sanitize(municipalityId);
    return usePaginatedData<Parish>({
      endpoint: `parishes/${cleanId ? `?municipality_id=${cleanId}` : ''}`,
      enabled: !!cleanId,
      maxPages: 1,
      timeout: 15000
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