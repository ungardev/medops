import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";
import { FamilyMember } from "@/context/PatientContext";

interface FamilyLink {
  id: number;
  patient_id: number;
  full_name: string;
  national_id: string | null;
  age: number | null;
  is_minor: boolean;
  birthdate: string | null;
  relationship_type: "self" | "child" | "dependent";
  relationship_type_display: string;
  created_at: string;
}

interface FamilyResponse {
  family: FamilyLink[];
}

interface CreateFamilyLinkRequest {
  patient: number;
  relationship_type: "child" | "dependent";
}

export function useFamilyMembers() {
  return useQuery<FamilyLink[]>({
    queryKey: ["patient", "family"],
    queryFn: async () => {
      const token = localStorage.getItem("patient_access_token") || localStorage.getItem("patient_drf_token");
      const data = await apiFetch<FamilyResponse>("patient-family-links/family/", {
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
      });
      return data.family.map((f) => ({
        link_id: f.id,
        patient_id: f.patient_id,
        full_name: f.full_name,
        national_id: f.national_id,
        age: f.age,
        is_minor: f.is_minor,
        birthdate: f.birthdate,
        relationship_type: f.relationship_type,
        relationship_type_display: f.relationship_type_display,
        created_at: f.created_at,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateFamilyLinkRequest) => {
      const token = localStorage.getItem("patient_access_token") || localStorage.getItem("patient_drf_token");
      const data = await apiFetch<FamilyLink>("patient-family-links/family/", {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      return {
        link_id: data.id,
        patient_id: data.patient_id,
        full_name: data.full_name,
        national_id: data.national_id,
        age: data.age,
        is_minor: data.is_minor,
        birthdate: data.birthdate,
        relationship_type: data.relationship_type,
        relationship_type_display: data.relationship_type_display,
        created_at: data.created_at,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", "family"] });
    },
  });
}

export function useRemoveFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId: number) => {
      const token = localStorage.getItem("patient_access_token") || localStorage.getItem("patient_drf_token");
      await apiFetch(`patient-family-links/${linkId}/unlink/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Token ${token}`,
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", "family"] });
    },
  });
}