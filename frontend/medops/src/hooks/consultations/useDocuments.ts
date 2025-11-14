// src/hooks/consultations/useDocuments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { MedicalDocument } from "../../types/consultation";

interface UploadDocumentInput {
  patient: number;
  file: File;
  description?: string;
  category?: string;
  appointment?: number; // 👈 opcional
}

export function useDocuments(patientId: number, appointmentId?: number) {
  return useQuery<MedicalDocument[]>({
    queryKey: ["documents", patientId, appointmentId],
    queryFn: async () => {
      const params = new URLSearchParams({ patient: String(patientId) });
      if (appointmentId) params.append("appointment", String(appointmentId));
      const res = await apiFetch(`documents/?${params.toString()}`);
      return res as MedicalDocument[];
    },
  });
}

export function useUploadDocument(patientId: number, appointmentId?: number) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: UploadDocumentInput) => {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("patient", String(data.patient));
      if (appointmentId) formData.append("appointment", String(appointmentId));
      if (data.description) formData.append("description", data.description);
      if (data.category) formData.append("category", data.category);

      return fetch("/api/documents/", {
        method: "POST",
        body: formData,
      }).then((res) => {
        if (!res.ok) throw new Error("Error al subir documento");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", patientId, appointmentId] });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}
