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
  });
}
export function usePatientServicesCatalog() {
  return useQuery({
    queryKey: ["patient", "services", "catalog"],
    queryFn: async () => {
      const response = await patientClient.getServicesCatalog();
      return response.data;
    },
  });
}
export function usePatientServicesRecommended() {
  return useQuery({
    queryKey: ["patient", "services", "recommended"],
    queryFn: async () => {
      const response = await patientClient.getServicesRecommended();
      return response.data;
    },
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
  });
}