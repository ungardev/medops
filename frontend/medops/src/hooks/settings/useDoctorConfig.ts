// src/hooks/settings/useDoctorConfig.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";
import { DoctorConfig } from "@/types/config";

export function useDoctorConfig() {
  const queryClient = useQueryClient();

  // ✅ GET configuración del médico operador (blindado)
  const query = useQuery<DoctorConfig>({
    queryKey: ["config", "doctor"],
    queryFn: async () => {
      console.log("FETCH DOCTOR CONFIG >>> ejecutando queryFn");
      const res = await api.get<DoctorConfig>("config/doctor/");
      const data = res.data;

      // ✅ Deduplicación defensiva de especialidades
      const dedupedSpecialties = Array.isArray(data.specialties)
        ? data.specialties.filter((s, i, self) => self.findIndex((x) => x.id === s.id) === i)
        : [];

      const dedupedIds = Array.isArray(data.specialty_ids)
        ? data.specialty_ids.filter((id, i, self) => self.indexOf(id) === i)
        : [];

      return {
        ...data,
        specialties: dedupedSpecialties,
        specialty_ids: dedupedIds,
        gender: data.gender || 'M', // Fallback seguro
      };
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    structuralSharing: true,
  });

  // ✅ PATCH actualización (multipart/form-data)
  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<DoctorConfig>) => {
      console.log("PATCH DOCTOR CONFIG >>>", newSettings);
      const formData = new FormData();

      // Mapeo inteligente de campos
      const fields = ['full_name', 'colegiado_id', 'license', 'email', 'phone', 'gender'];
      fields.forEach(field => {
        const val = newSettings[field as keyof DoctorConfig];
        if (val !== undefined && val !== null) formData.append(field, String(val));
      });

      // ✅ Firma digital
      if (newSettings.signature instanceof File) {
        formData.append("signature", newSettings.signature);
      }

      // ✅ Specialty IDs (Manejo de arrays en FormData)
      if (Array.isArray(newSettings.specialty_ids)) {
        if (newSettings.specialty_ids.length === 0) {
          formData.append("specialty_ids", ""); // Limpiar selección
        } else {
          newSettings.specialty_ids.forEach((id) => {
            formData.append("specialty_ids", String(id));
          });
        }
      }

      const res = await api.patch("config/doctor/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["config", "doctor"], data);
    },
  });

  return {
    ...query,
    updateDoctor: mutation.mutateAsync,
    handleSignatureChange: (file: File) => URL.createObjectURL(file),
  };
}
