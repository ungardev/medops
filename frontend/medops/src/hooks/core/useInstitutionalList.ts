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
      const arr: T[] = Array.isArray(response)
        ? response
        : Array.isArray(response?.results)
        ? response.results
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
