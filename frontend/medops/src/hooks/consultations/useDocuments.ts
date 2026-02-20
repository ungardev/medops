// src/hooks/consultations/useDocuments.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
export interface DocumentItem {
  audit_code: string;
  category: string;
  title: string;
  filename: string | null;
  file_url: string | null;
}
export interface DocumentsResponse {
  consultation_id: number;
  audit_code: string | null;
  generated_at: string;
  documents: DocumentItem[];
  skipped: string[];
  errors?: { category: string; error: string }[];
}
interface UploadDocumentInput {
  patient: number;
  file: File;
  description?: string;
  category?: string;
  appointment?: number;
}
// ✅ FIX: Interfaz para la respuesta raw del backend
interface BackendDocumentsResponse {
  audit_code?: string | null;
  generated_at?: string;
  documents?: any[];
  skipped?: string[];
  errors?: { category: string; error: string }[];
}
export function useDocuments(patientId: number, appointmentId?: number) {
  return useQuery<DocumentsResponse>({
    queryKey: ["documents", patientId, appointmentId],
    queryFn: async () => {
      const params = new URLSearchParams({ patient: String(patientId) });
      if (appointmentId) params.append("appointment", String(appointmentId));
      const res = await apiFetch(`documents/?${params.toString()}`);
      // Caso 1: backend devuelve wrapper con documents (skipped opcional)
      // ✅ FIX: Usar type assertion para acceder a propiedades
      if (res && typeof res === "object" && "documents" in res) {
        const data = res as BackendDocumentsResponse;
        return {
          consultation_id: appointmentId ?? 0,
          audit_code: data.audit_code ?? null,
          generated_at: data.generated_at ?? new Date().toISOString(),
          documents: data.documents || [],
          skipped: data.skipped || [],
          errors: data.errors || [],
        } as DocumentsResponse;
      }
      // Caso 2: backend devuelve array clásico de MedicalDocument[]
      if (Array.isArray(res)) {
        const documents: DocumentItem[] = (res as any[]).map((d: any) => {
          const fileUrl: string | null = d.file ?? d.file_url ?? null;
          const filename =
            fileUrl ? fileUrl.split("/").filter(Boolean).pop() ?? null : null;
          return {
            audit_code: d.audit_code ?? String(d.id ?? "") ?? "N/A",
            category: d.category ?? "unknown",
            title: d.description ?? "Documento",
            filename,
            file_url: fileUrl,
          };
        });
        return {
          consultation_id: appointmentId ?? 0,
          audit_code: null,
          generated_at: new Date().toISOString(),
          documents,
          skipped: [],
          errors: [],
        } as DocumentsResponse;
      }
      // Caso 3: respuesta inesperada — devolvemos vacío defensivo
      return {
        consultation_id: appointmentId ?? 0,
        audit_code: null,
        generated_at: new Date().toISOString(),
        documents: [],
        skipped: [],
        errors: [],
      };
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
      const res = await fetch("/api/documents/", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al subir documento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["documents", patientId, appointmentId],
      });
    },
  });
  return {
    ...mutation,
    isPending: mutation.isPending,
  };
}