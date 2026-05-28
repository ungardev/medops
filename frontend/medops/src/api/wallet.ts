// src/api/wallet.ts
import { apiFetch } from "./client";
import type { DoctorWallet } from "@/types/payments";

export interface WalletSummary {
  balance: string;
  pending_balance: string;
  total_earned: string;
  total_disbursed: string;
  last_disbursement_at: string | null;
}

export interface WalletMovement {
  type: "payment" | "disbursement";
  data: any;
}

export interface WalletMovementsResponse {
  movements: WalletMovement[];
  total_payments: number;
  total_disbursements: number;
}

export interface DisbursementRequest {
  amount: string;
  bank_code: string;
  bank_account: string;
  disbursement_type: "instant" | "batch" | "scheduled";
}

export interface DisbursementResponse {
  success: boolean;
  disbursement_id?: number;
  reference?: string;
  status?: string;
  message?: string;
  error?: string;
}

export const getWallet = (): Promise<DoctorWallet> =>
  apiFetch<DoctorWallet>("doctor/wallet/");

export const getWalletSummary = (): Promise<WalletSummary> =>
  apiFetch<WalletSummary>("doctor/wallet/summary/");

export const getWalletMovements = (limit = 10, offset = 0): Promise<WalletMovementsResponse> =>
  apiFetch<WalletMovementsResponse>(
    `doctor/wallet/movements/?limit=${limit}&offset=${offset}`
  );

export const addFundsToWallet = (
  amount: string,
  transactionRef: string,
  concept = "Depósito manual"
): Promise<{ success: boolean; wallet_balance: string; amount_added: string }> =>
  apiFetch("doctor/wallet/", {
    method: "POST",
    body: JSON.stringify({ amount, transaction_ref: transactionRef, concept }),
  });

export const getDisbursements = (): Promise<any[]> =>
  apiFetch<any[]>("doctor/disbursements/");

export const createDisbursement = (
  data: DisbursementRequest
): Promise<DisbursementResponse> =>
  apiFetch<DisbursementResponse>("doctor/disbursements/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getDisbursementDetail = (id: number): Promise<any> =>
  apiFetch<any>(`doctor/disbursements/${id}/`);

export const cancelDisbursement = (id: number): Promise<{ success: boolean; message?: string }> =>
  apiFetch(`doctor/disbursements/${id}/cancel/`, {
    method: "POST",
  });
