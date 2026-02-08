// src/hooks/helpers/usePaginatedData.ts
import { useState, useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
interface UsePaginatedDataOptions<T> {
  endpoint: string;
  enabled?: boolean;
  queryParams?: Record<string, any>;
  filterFn?: (item: T, queryParams: Record<string, any>) => boolean;
  maxPages?: number;
  timeout?: number;
}
function usePaginatedData<T>({ 
  endpoint, 
  enabled = true, 
  queryParams = {},
  filterFn,
  maxPages = 100,
  timeout = 30000
}: UsePaginatedDataOptions<T>) {
  const [totalCount, setTotalCount] = useState(0);
  const fetchAllPages = async (): Promise<T[]> => {
    console.log(`🔍 Starting fetch all pages for ${endpoint}`);
    let page = 1;
    let allData: T[] = [];
    let hasNext = true;
    let pageCount = 0;
    
    while (hasNext && page <= maxPages) {
      try {
        const response = await api.get<PaginatedResponse<T>>(
          endpoint,
          { 
            params: { page: page.toString() },
            timeout 
          }
        );
        
        allData = [...allData, ...response.data.results];
        
        if (page === 1) {
          setTotalCount(response.data.count);
        }
        
        hasNext = response.data.next !== null;
        page++;
        pageCount++;
        
        if (allData.length >= 10000) {
          console.warn(`🔍 ${endpoint}: Max items (10000) reached`);
          break;
        }
        
      } catch (error) {
        console.error(`🔍 ${endpoint} page ${page} error:`, error);
        break;
      }
    }
    
    console.log(`🔍 ${endpoint} complete: ${allData.length} items`);
    return allData;
  };
  const query = useQuery({
    queryKey: [endpoint, 'all'],
    queryFn: fetchAllPages,
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  // ✅ FILTRAR DATOS EN EL FRONTEND
  const filteredData = useMemo(() => {
    if (!query.data) return [];
    if (!filterFn || !queryParams || Object.keys(queryParams).length === 0) {
      return query.data;
    }
    
    console.log(`🔍 Filtering ${endpoint} with params:`, queryParams);
    const filtered = query.data.filter(item => filterFn(item, queryParams));
    console.log(`🔍 ${endpoint} filtered: ${filtered.length}/${query.data.length}`);
    return filtered;
  }, [query.data, filterFn, queryParams, endpoint]);
  return {
    data: filteredData,
    isLoading: query.isLoading,
    error: query.error,
    totalCount: filteredData.length,
    isLoadingPages: query.isLoading ? 1 : 0,
    refetch: query.refetch
  };
}
export default usePaginatedData;