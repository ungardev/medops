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
      endpoint: `states/${cleanId ? `?country_id=${cleanId}` : ''}`,
      enabled: !!cleanId,
      maxPages: 1,
      timeout: 15000
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
      endpoint: `neighborhoods/${cleanId ? `?parish_id=${cleanId}` : ''}`,
      enabled: !!cleanId,
      maxPages: 1,
      timeout: 15000
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