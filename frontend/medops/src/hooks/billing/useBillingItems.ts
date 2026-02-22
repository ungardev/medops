// src/hooks/billing/useBillingItems.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../api/client";
import type { BillingItem, BillingItemInput } from "../../types/billing";

export function useBillingItems(categoryId?: number | null, search?: string) {
  return useQuery<BillingItem[]>({
    queryKey: ["billing-items", categoryId, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryId) params.append("category", String(categoryId));
      if (search) params.append("search", search);
      params.append("is_active", "true");
      
      const data = await apiFetch<{ results?: BillingItem[] } | BillingItem[]>(
        `billing-items/?${params.toString()}`
      );
      return Array.isArray(data) ? data : data?.results ?? [];
    },
  });
}

export function useBillingItem(id: number | null) {
  return useQuery<BillingItem>({
    queryKey: ["billing-items", id],
    queryFn: () => apiFetch<BillingItem>(`billing-items/${id}/`),
    enabled: !!id,
  });
}

export function useCreateBillingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BillingItemInput) =>
      apiFetch<BillingItem>("billing-items/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-items"] });
      queryClient.invalidateQueries({ queryKey: ["billing-categories"] });
    },
  });
}

export function useUpdateBillingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BillingItemInput> }) =>
      apiFetch<BillingItem>(`billing-items/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-items"] });
    },
  });
}

export function useDeleteBillingItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch(`billing-items/${id}/`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-items"] });
      queryClient.invalidateQueries({ queryKey: ["billing-categories"] });
    },
  });
}

export function useBillingItemsSearch(query: string) {
  return useQuery<BillingItem[]>({
    queryKey: ["billing-items-search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const data = await apiFetch<{ results?: BillingItem[] } | BillingItem[]>(
        `billing-items/search/?search=${encodeURIComponent(query)}`
      );
      return Array.isArray(data) ? data : data?.results ?? [];
    },
    enabled: query.length >= 2,
  });
}