// src/hooks/payments/useVerifyMobilePayment.ts
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/api/client';
// 🆕 TIPOS PARA VERIFICACIÓN MÓVIL
interface VerifyMobilePaymentRequest {
  chargeOrderId: number;
  expectedAmount: number;
  timeWindowHours?: number;
  referencePattern?: string;
}
interface VerifyMobilePaymentData {
  amount_verified: string;
  payment_id: number;
  reference_number: string;
  bank_transaction_id: string;
  new_balance: string;
  payment_status: string;
  verification_method: string;
}
interface VerifyMobilePaymentError {
  code: string;
  error: string;
  message: string;
  fallback_required?: boolean;
}
interface UseVerifyMobilePaymentOptions {
  onSuccess?: (data: VerifyMobilePaymentData) => void;
  onError?: (error: VerifyMobilePaymentError) => void;
}
// 🎯 HOOK PRINCIPAL DE VERIFICACIÓN MÓVIL
export const useVerifyMobilePayment = (options: UseVerifyMobilePaymentOptions = {}) => {
  return useMutation<
    {data: VerifyMobilePaymentData; error: VerifyMobilePaymentError; success: boolean; message: string;},
    Error,
    VerifyMobilePaymentRequest
  >({
    mutationFn: async (request: VerifyMobilePaymentRequest) => {
      console.log('[MOBILE_PAYMENT_VERIFY] Starting verification:', {
        chargeOrderId: request.chargeOrderId,
        expectedAmount: request.expectedAmount,
        timeWindowHours: request.timeWindowHours
      });
      try {
        // 🚀 CALL TO OUR NEW ENDPOINT
        const response = await apiFetch<any>('/api/payments/verify-mobile-payment/', {
          method: 'POST',
          body: JSON.stringify({
            charge_order_id: request.chargeOrderId,
            expected_amount: request.expectedAmount,
            time_window_hours: request.timeWindowHours || 24,
            reference_pattern: request.referencePattern || 'AUTO_DETECT'
          })
        });
        console.log('[MOBILE_PAYMENT_VERIFY] Response:', response);
        // 📊 HANDLE SUCCESS RESPONSE
        if (response.success && response.data) {
          console.log('[MOBILE_PAYMENT_VERIFY] Success: Verification completed');
          options.onSuccess?.(response.data);
          
          return {
            success: true,
            message: response.message,
            data: response.data,
            error: {
              code: 'NONE',
              error: '',
              message: ''
            }
          };
        }
        // 🚨 HANDLE ERROR RESPONSE
        const errorResponse: VerifyMobilePaymentError = {
          code: response.error_code || 'UNKNOWN_ERROR',
          error: response.error || 'Verification failed',
          message: response.message || 'Unknown error occurred',
          fallback_required: response.fallback_required || false
        };
        console.log('[MOBILE_PAYMENT_VERIFY] Error:', errorResponse);
        
        // ❌ NOTIFICAR ERROR
        options.onError?.(errorResponse);
        return {
          success: false,
          message: response.message || 'Verification failed',
          data: {
            amount_verified: '0',
            payment_id: 0,
            reference_number: '',
            bank_transaction_id: '',
            new_balance: '0',
            payment_status: 'failed',
            verification_method: 'api'
          },
          error: errorResponse
        };
      } catch (error: any) {
        console.log('[MOBILE_PAYMENT_VERIFY] Network error:', error);
        
        const networkError: VerifyMobilePaymentError = {
          code: 'NETWORK_ERROR',
          error: 'Connection failed',
          message: error.message || 'Network connection failed',
          fallback_required: true
        };
        options.onError?.(networkError);
        return {
          success: false,
          message: 'Network connection failed',
          data: {
            amount_verified: '0',
            payment_id: 0,
            reference_number: '',
            bank_transaction_id: '',
            new_balance: '0',
            payment_status: 'failed',
            verification_method: 'network_error'
          },
          error: networkError
        };
      }
    },
    
    // 🔄 REINTENTOS PARA ERRORES DE RED/CONEXIÓN
    retry: (failureCount: number, error: any): boolean => {
      // Solo reintentar errores de red, no errores de lógica de negocio
      const isNetworkError = error?.message?.includes('timeout') || 
                           error?.message?.includes('connection') || 
                           error?.message?.includes('network') ||
                           error?.code === 'NETWORK_ERROR';
      
      return isNetworkError && failureCount < 3;
    },
    
    // 📢 CONFIGURACIÓN DE REINTENTOS
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000)
  });
};
// 🎯 EXPORTAR TIPOS PARA USO EXTERNO
export type { 
  VerifyMobilePaymentRequest, 
  VerifyMobilePaymentData, 
  VerifyMobilePaymentError, 
  UseVerifyMobilePaymentOptions 
};