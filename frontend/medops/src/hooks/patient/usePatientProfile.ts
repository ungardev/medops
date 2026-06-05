// src/hooks/patient/usePatientProfile.ts
import { useQuery } from '@tanstack/react-query';
import { patientClient } from '@/api/patient/client';

export interface PatientProfileData {
  patient: {
    id: number;
    full_name: string;
    national_id?: string;
    phone?: string;
    birthdate?: string;
    age?: number;
    gender?: string;
    address?: string;
    is_pediatric: boolean;
  };
  user: {
    email: string;
    phone?: string;
    is_verified: boolean;
    two_factor_enabled: boolean;
    notifications_email: boolean;
    notifications_sms: boolean;
    notifications_whatsapp: boolean;
  };
}

export function usePatientProfile() {
  return useQuery<PatientProfileData>({
    queryKey: ['patient', 'profile'],
    queryFn: async () => {
      const response = await patientClient.getProfile();
      return response.data;
    },
    staleTime: 5 * 60 * 1000,    // 5 minutes - profile rarely changes
    gcTime: 60 * 60 * 1000,      // 1 hour
    refetchOnWindowFocus: false,
    retry: 1,
  });
}