// src/hooks/doctor/useDoctor.ts
import { useQuery } from '@tanstack/react-query';
import { doctorClient } from '@/api/patient/client';
import type { Doctor, DoctorService } from '@/api/patient/client';
export const useDoctor = (doctorId: number) => {
  return useQuery<Doctor, Error>({
    queryKey: ['doctor', doctorId],
    queryFn: async () => {
      const response = await doctorClient.getDoctorProfile(doctorId);
      return response.data; // Extraer los datos de la respuesta Axios
    },
    enabled: !!doctorId,
    staleTime: 10 * 60 * 1000,   // 10 minutes - doctor profile rarely changes
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
export const useDoctorServices = (doctorId: number) => {
  return useQuery<DoctorService[], Error>({
    queryKey: ['doctorServices', doctorId],
    queryFn: async () => {
      const response = await doctorClient.getDoctorServices(doctorId);
      return response.data; // Extraer los datos de la respuesta Axios
    },
    enabled: !!doctorId,
    staleTime: 5 * 60 * 1000,    // 5 minutes
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
