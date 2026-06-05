// src/hooks/patient/usePatientServices.ts
import { useQuery } from "@tanstack/react-query";
import { patientClient } from "@/api/patient/client";
export function usePatientServicesHistory() {
  return useQuery({
    queryKey: ["patient", "services", "history"],
    queryFn: async () => {
      const response = await patientClient.getServicesHistory();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
export function usePatientServicesCatalog() {
  return useQuery({
    queryKey: ["patient", "services", "catalog"],
    queryFn: async () => {
      const response = await patientClient.getServicesCatalog();
      return response.data;
    },
    staleTime: 10 * 60 * 1000,   // 10 minutes - catalog is almost static
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
export function usePatientServicesRecommended() {
  return useQuery({
    queryKey: ["patient", "services", "recommended"],
    queryFn: async () => {
      const response = await patientClient.getServicesRecommended();
      return response.data;
    },
    staleTime: 2 * 60 * 1000,    // 2 minutes - recommendations may change
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
export function usePatientSearchDoctors(query: string) {
  return useQuery({
    queryKey: ["patient", "search", "doctors", query],
    queryFn: async () => {
      const response = await patientClient.searchDoctors(query);
      return response.data;
    },
    enabled: query.length > 0,
    staleTime: 30 * 1000,       // 30 seconds - search results
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
export function usePatientSearchServices(query: string) {
  return useQuery({
    queryKey: ["patient", "search", "services", query],
    queryFn: async () => {
      const response = await patientClient.searchServices(query);
      return response.data;
    },
    enabled: query.length > 0,
    staleTime: 30 * 1000,       // 30 seconds - search results
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}