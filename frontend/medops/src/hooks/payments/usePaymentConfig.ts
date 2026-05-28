// src/hooks/payments/usePaymentConfig.ts
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/api/client";

export interface PaymentConfig {
  id: number;
  doctor: number;
  doctor_name: string;
  bank_name: string;
  bank_account: string;
  bank_rif: string;
  bank_phone: string;
  bank_account_holder: string;
  preferred_bank: string;
  banesco_enabled: boolean;
  binance_enabled: boolean;
  payment_mobile_enabled: boolean;
  bank_transfer_enabled: boolean;
  crypto_enabled: boolean;
  min_disbursement_amount: string;
  is_verified: boolean;
}

export function usePaymentConfig() {
  return useQuery({
    queryKey: ["payment-config"],
    queryFn: () => apiFetch<PaymentConfig>("payments/config/"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
