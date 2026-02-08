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
  const fetchAllPages = async (): Promise<T[]> => {
    console.log(`🔍 Starting fetch all pages for ${endpoint}`, { queryParams });
    let page = 1;
    let allData: T[] = [];
    let hasNext = true;
    let pageCount = 0;
    let expectedTotal = 0;
    
    while (hasNext && page <= maxPages) {
      // ✅ CONSTRUIR PARAMS CORRECTAMENTE
      const params: Record<string, string> = {};
      
      // Agregar queryParams personalizados (country, state, etc.)
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params[key] = String(value);
        }
      });
      
      // Agregar paginación
      params.page = page.toString();
      
      console.log(`🔍 ${endpoint} - Page ${page} params:`, params);
      
      try {
        const response = await api.get<PaginatedResponse<T>>(
          endpoint,
          { 
            params,
            timeout 
          }
        );
        
        console.log(`🔍 ${endpoint} page ${page}:`, {
          results: response.data.results.length,
          total: response.data.count,
          hasNext: !!response.data.next
        });
        
        allData = [...allData, ...response.data.results];
        
        // Guardar total esperado desde primera página
        if (page === 1) {
          expectedTotal = response.data.count;
          setTotalCount(response.data.count);
        }
        
        // Verificar si hay más páginas
        hasNext = response.data.next !== null;
        page++;
        pageCount++;
        
        // Safety limits
        if (allData.length >= 10000) {
          console.warn(`🔍 ${endpoint}: Max items (10000) reached`);
          break;
        }
        
      } catch (error: unknown) {
        console.error(`🔍 ${endpoint} page ${page} error:`, error);
        break;
      }
    }
    
    console.log(`🔍 ${endpoint} complete:`, {
      pages: pageCount,
      items: allData.length,
      expected: expectedTotal
    });
    
    return allData;
  };
  const query = useQuery({
    queryKey: [endpoint, 'all', queryParams],
    queryFn: fetchAllPages,
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  return {
    data: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    totalCount,
    isLoadingPages: query.isLoading ? 1 : 0, // ✅ Retornar number en lugar de boolean
    refetch: query.refetch
  };
}
export default usePaginatedData;