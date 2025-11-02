// src/hooks/consultations/useDocuments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { MedicalDocument } from "../../types/consultation";

interface UploadDocumentInput {
  patient: number;
  file: File;
  description?: string;
  category?: string;
}

export function useDocuments(patientId: number) {
  return useQuery<MedicalDocument[]>({
    queryKey: ["documents", patientId],
    queryFn: async () => {
      const res = await apiFetch(`documents/?patient=${patientId}`);
      return res as MedicalDocument[];
    },
  });
}

export function useUploadDocument(patientId: number) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: UploadDocumentInput) => {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("patient", String(data.patient));
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
      queryClient.invalidateQueries({ queryKey: ["documents", patientId] });
    },
  });

  return {
    ...mutation,
    isPending: mutation.isPending, // ✅ v5
  };
}
