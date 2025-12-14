// src/hooks/settings/useDoctorConfig.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/apiClient";  // ⚔️ Cliente institucional
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

      console.log("DOCTOR RAW >>>", {
        id: data.id,
        specialty_ids: data.specialty_ids,
        specialties: data.specialties?.map((s) => s.id),
      });

      // ✅ Deduplicación defensiva
      const dedupedSpecialties = Array.isArray(data.specialties)
        ? data.specialties.filter(
            (s, i, self) => self.findIndex((x) => x.id === s.id) === i
          )
        : [];

      const dedupedIds = Array.isArray(data.specialty_ids)
        ? data.specialty_ids.filter(
            (id, i, self) => self.indexOf(id) === i
          )
        : [];

      const finalData = {
        ...data,
        specialties: dedupedSpecialties,
        specialty_ids: dedupedIds,
      };

      console.log("DOCTOR DEDUPED >>>", {
        ids: finalData.specialty_ids,
        specs: finalData.specialties.map((s) => s.id),
      });

      return finalData;
    },

    // ✅ Blindaje institucional contra re-fetches innecesarios
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 2, // 2 horas

    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,

    structuralSharing: true,
  });

  // ✅ PATCH actualización del médico operador (multipart/form-data)
  const mutation = useMutation({
    mutationFn: async (newSettings: Partial<DoctorConfig>) => {
      console.log("PATCH DOCTOR CONFIG >>>", newSettings);

      const formData = new FormData();

      // ✅ CAMPOS QUE SIEMPRE SE DEBEN ENVIAR (aunque estén vacíos)
      if (newSettings.full_name !== undefined)
        formData.append("full_name", String(newSettings.full_name));

      if (newSettings.colegiado_id !== undefined)
        formData.append("colegiado_id", String(newSettings.colegiado_id));

      if (newSettings.license !== undefined)
        formData.append("license", String(newSettings.license));

      if (newSettings.email !== undefined)
        formData.append("email", String(newSettings.email));

      if (newSettings.phone !== undefined)
        formData.append("phone", String(newSettings.phone));

      // ✅ Firma digital
      if (newSettings.signature instanceof File) {
        formData.append("signature", newSettings.signature);
      }

      // ✅ specialty_ids SIEMPRE se envía, incluso si está vacío
      if (Array.isArray(newSettings.specialty_ids)) {
        if (newSettings.specialty_ids.length === 0) {
          formData.append("specialty_ids", "");
        } else {
          newSettings.specialty_ids.forEach((id) => {
            formData.append("specialty_ids", String(id));
          });
        }
      }

      // ✅ LOG DE CAMPOS ENVIADOS
      for (const pair of formData.entries()) {
        console.log("FORMDATA >>>", pair[0], "=", pair[1]);
      }

      const res = await api.patch("config/doctor/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("PATCH RESPONSE >>>", res.data);

      return res.data;
    },

    // ✅ Actualiza el cache sin re-fetch
    onSuccess: (data) => {
      console.log("CACHE UPDATED >>>", data);
      queryClient.setQueryData(["config", "doctor"], data);
    },
  });

  // ✅ Manejo de firma digital (preview)
  const handleSignatureChange = (file: File) => URL.createObjectURL(file);

  return {
    ...query,
    updateDoctor: mutation.mutateAsync,
    handleSignatureChange,
  };
}
