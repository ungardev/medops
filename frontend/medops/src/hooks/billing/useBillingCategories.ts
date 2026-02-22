// src/hooks/billing/useBillingCategories.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client"; 
import type { BillingCategory, BillingCategoryInput } from "../../types/billing";

export function useBillingCategories() {
  return useQuery<BillingCategory[]>({
    queryKey: ["billing-categories"],
    queryFn: async () => {
      const data = await apiFetch<{ results?: BillingCategory[] } | BillingCategory[]>(
        "billing-categories/"
      );
      return Array.isArray(data) ? data : data?.results ?? [];
    },
  });
}

export function useBillingCategory(id: number | null) {
  return useQuery<BillingCategory>({
    queryKey: ["billing-categories", id],
    queryFn: () => apiFetch<BillingCategory>(`billing-categories/${id}/`),
    enabled: !!id,
  });
}

export function useCreateBillingCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BillingCategoryInput) =>
      apiFetch<BillingCategory>("billing-categories/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-categories"] });
    },
  });
}

export function useUpdateBillingCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BillingCategoryInput> }) =>
      apiFetch<BillingCategory>(`billing-categories/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-categories"] });
    },
  });
}

export function useDeleteBillingCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`billing-categories/${id}/`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-categories"] });
    },
  });
}