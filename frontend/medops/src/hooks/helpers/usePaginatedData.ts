// src/hooks/helpers/usePaginatedData.ts
import { useState } from 'react';
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
  maxPages?: number;
  timeout?: number;
}
function usePaginatedData<T>({ 
  endpoint, 
  enabled = true, 
  queryParams = {},
  maxPages = 100,
  timeout = 30000
}: UsePaginatedDataOptions<T>) {
  const [totalCount, setTotalCount] = useState(0);
  const [currentLoadingPages, setCurrentLoadingPages] = useState(0);
  const fetchAllPages = async (): Promise<T[]> => {
    console.log(`🔍 Starting fetch all pages for ${endpoint}`);
    let page = 1;
    let allData: T[] = [];
    let hasNext = true;
    let pageCount = 0;
    
    while (hasNext && page <= maxPages) {
      setCurrentLoadingPages(pageCount + 1);
      
      const params = new URLSearchParams({
        ...queryParams,
        page: page.toString()
      });
      
      try {
        // ✅ SOLUCIÓN: Usar timeout nativo de Axios
        const response = await api.get<PaginatedResponse<T>>(
          `${endpoint}?${params}`,
          { timeout }
        );
        
        console.log(`🔍 ${endpoint} page ${page}:`, {
          results: response.data.results.length,
          total: response.data.count,
          hasNext: !!response.data.next
        });
        
        allData = [...allData, ...response.data.results];
        
        // Set total count from first page
        if (page === 1) {
          setTotalCount(response.data.count);
        }
        
        // Check if there are more pages
        hasNext = response.data.next !== null;
        page++;
        pageCount++;
        
        // Safety limits
        if (allData.length >= 5000) {
          console.warn(`🔍 ${endpoint}: Max items (5000) reached`);
          break;
        }
        
      } catch (error: unknown) {
        console.error(`🔍 ${endpoint} page ${page} error:`, error);
        break;
      }
    }
    
    setCurrentLoadingPages(0);
    
    console.log(`🔍 ${endpoint} complete:`, {
      pages: pageCount,
      items: allData.length,
      expected: totalCount
    });
    
    return allData;
  };
  const query = useQuery({
    queryKey: [endpoint, 'all', queryParams],
    queryFn: fetchAllPages,
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    totalCount,
    isLoadingPages: currentLoadingPages,
    refetch: query.refetch
  };
}
export default usePaginatedData;