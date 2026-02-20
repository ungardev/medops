// src/hooks/core/useInstitutionalList.ts
import { useQuery, UseQueryOptions, QueryKey } from "@tanstack/react-query";
interface InstitutionalListResult<T> {
  list: T[];
  totalCount: number;
}
export function useInstitutionalList<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<any>,
  options?: Partial<UseQueryOptions<any, Error, InstitutionalListResult<T>>>
) {
  return useQuery<any, Error, InstitutionalListResult<T>>({
    queryKey,
    queryFn,
    select: (response: any): InstitutionalListResult<T> => {
      // ✅ FIX: Soporte para múltiples formatos de respuesta del backend
      const arr: T[] = Array.isArray(response)
        ? response
        : Array.isArray(response?.list)
        ? response.list
        : Array.isArray(response?.results)
        ? response.results
        : Array.isArray(response?.documents)
        ? response.documents
        : [];
      return {
        list: arr,
        totalCount: arr.length,
      };
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
    ...options,
  });
}