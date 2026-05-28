// src/hooks/wallet/useWallet.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWallet,
  getWalletSummary,
  getWalletMovements,
  getDisbursements,
  createDisbursement,
  cancelDisbursement,
  type WalletSummary,
  type WalletMovement,
  type DisbursementRequest,
} from "@/api/wallet";

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: getWallet,
  });
}

export function useWalletSummary() {
  return useQuery({
    queryKey: ["wallet-summary"],
    queryFn: getWalletSummary,
  });
}

export function useWalletMovements(limit = 10, offset = 0) {
  return useQuery({
    queryKey: ["wallet-movements", limit, offset],
    queryFn: () => getWalletMovements(limit, offset),
  });
}

export function useDisbursements() {
  return useQuery({
    queryKey: ["disbursements"],
    queryFn: getDisbursements,
  });
}

export function useCreateDisbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DisbursementRequest) => createDisbursement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-summary"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-movements"] });
      queryClient.invalidateQueries({ queryKey: ["disbursements"] });
    },
  });
}

export function useCancelDisbursement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cancelDisbursement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-summary"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-movements"] });
      queryClient.invalidateQueries({ queryKey: ["disbursements"] });
    },
  });
}
