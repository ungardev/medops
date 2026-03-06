// src/hooks/patient/useUpdatePatientProfile.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patientClient } from "@/api/patient/client";

interface UpdateProfileData {
  email?: string;
  phone?: string;
  address?: string;
  current_password?: string;
  notifications_email?: boolean;
  notifications_sms?: boolean;
  notifications_whatsapp?: boolean;
}

interface UpdateProfileResponse {
  success: boolean;
  message: string;
}
export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();
  return useMutation<UpdateProfileResponse, Error, UpdateProfileData>({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await patientClient.updateProfile(data);
      return response.data as UpdateProfileResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientProfile"] });
      queryClient.invalidateQueries({ queryKey: ["patientDashboard"] });
    },
    onError: (error) => {
      console.error("Error al actualizar perfil:", error);
    },
  });
}