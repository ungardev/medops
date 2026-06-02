// src/hooks/patients/useDeleteDocument.ts
import { useMutation, useQueryClient, QueryKey } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import { MedicalDocument } from "../../types/documents";
import { InstitutionalListResult } from "../core/useInstitutionalList";

type MutationContext = { previous: InstitutionalListResult<MedicalDocument> | undefined };

export function useDeleteDocument(patientId: number) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number, MutationContext>({
    mutationFn: async (documentId: number) => {
      return apiFetch(`patients/${patientId}/documents/${documentId}/`, {
        method: "DELETE",
      });
    },
    onMutate: async (documentId: number) => {
      const queryKey: QueryKey = ["patient-documents", patientId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InstitutionalListResult<MedicalDocument>>(queryKey);
      queryClient.setQueryData<InstitutionalListResult<MedicalDocument>>(
        queryKey,
        (old) => {
          if (!old) return old;
          return {
            ...old,
            list: (old.list || []).filter((d: MedicalDocument) => d.id !== documentId),
          };
        }
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["patient-documents", patientId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-documents", patientId] });
    },
  });
}