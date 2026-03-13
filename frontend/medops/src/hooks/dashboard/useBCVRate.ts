// src/hooks/dashboard/useBCVRate.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
export interface BCVRate {
  rate: number;
  timestamp: number;
}
const CACHE_KEY = "bcv_rate";
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutos en milisegundos (reducido de 1 hora)
// Helper para obtener tasa desde localStorage
const getRateFromCache = (): BCVRate | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: BCVRate = JSON.parse(cached);
    const now = Date.now();
    
    // Verificar si el cache aún es válido (menos de 5 minutos)
    if (now - data.timestamp < CACHE_EXPIRY) {
      return data;
    }
    
    // Cache expirado, eliminar
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error("Error reading BCV rate from cache:", error);
    return null;
  }
};
// Helper para guardar tasa en localStorage
const setRateToCache = (rate: number) => {
  try {
    const data: BCVRate = {
      rate,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving BCV rate to cache:", error);
  }
};
export function useBCVRate() {
  return useQuery<BCVRate>({
    queryKey: ["bcv-rate"],
    queryFn: async () => {
      // 1. Intentar obtener desde cache
      const cached = getRateFromCache();
      if (cached) {
        return cached;
      }
      
      // 2. Si no hay cache, obtener desde API
      try {
        const data = await apiFetch<any>("bcv-rate/");
        const rate = data.rate || data.value || 0;
        
        // 3. Guardar en cache
        setRateToCache(rate);
        
        return {
          rate,
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error("Error fetching BCV rate:", error);
        // En caso de error, devolver tasa por defecto o 0
        return {
          rate: 0,
          timestamp: Date.now(),
        };
      }
    },
    staleTime: CACHE_EXPIRY, // Cache válido por 5 minutos
  });
}
// Helper para convertir USD a VES
export function convertUSDToVES(usdAmount: number, bcvRate: BCVRate): number {
  return usdAmount * bcvRate.rate;
}