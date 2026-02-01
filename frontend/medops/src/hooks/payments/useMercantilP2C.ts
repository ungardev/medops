// src/hooks/payments/useMercantilP2C.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { 
  generateP2CQR, 
  checkP2CStatus, 
  cancelP2CTransaction,
  P2CPaymentRequest, 
  P2CPaymentResponse,
  MercantilP2CTransaction
} from '../../api/payments';
import { wsService, P2CWebSocketData } from '../../services/websocket';
// =====================================================
// 🎯 TYPE GUARDS Y UTILIDADES DE VALIDACIÓN
// =====================================================
const isApiError = (error: unknown): error is Error => {
  return error instanceof Error;
};
// ✅ CORREGIDO: Validación explícita línea por línea
const validateTransaction = (transaction: unknown): transaction is MercantilP2CTransaction => {
  if (!transaction) return false;
  if (typeof transaction !== 'object') return false;
  if (!('id' in transaction)) return false;
  if (!('merchant_order_id' in transaction)) return false;
  if (!('status' in transaction)) return false;
  return true;
};
const P2CLogger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useMercantilP2C] DEBUG: ${message}`, data);
    }
  },
  error: (message: string, error?: unknown) => {
    console.error(`[useMercantilP2C] ERROR: ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[useMercantilP2C] WARN: ${message}`, data);
  },
  info: (message: string, data?: any) => {
    console.info(`[useMercantilP2C] INFO: ${message}`, data);
  },
};
// =====================================================
// 🎯 FUNCIONES DE CONVERSIÓN DE TIPOS SEGUROS
// =====================================================
const convertWebSocketDataToPaymentResponse = (
  data: P2CWebSocketData, 
  currentTransaction?: MercantilP2CTransaction | null
): P2CPaymentResponse => {
  return {
    success: true,
    merchant_order_id: data.merchant_order_id,
    status: data.status,
    amount: data.amount,
    transaction: currentTransaction ? {
      ...currentTransaction,
      status: data.status,
      mercantil_transaction_id: data.mercantil_transaction_id ?? undefined,
      confirmed_at: data.confirmed_at,
    } : undefined
  };
};
const createCallbackData = (
  statusData: P2CPaymentResponse
): P2CWebSocketData => {
  return {
    merchant_order_id: statusData.merchant_order_id || '',
    status: statusData.status as P2CWebSocketData['status'],
    amount: statusData.amount,
    // ✅ CORREGIDO: Convertir null a undefined explícitamente
    mercantil_transaction_id: statusData.transaction?.mercantil_transaction_id ?? undefined,
  };
};
const isValidStatus = (status: unknown): status is P2CWebSocketData['status'] => {
  return typeof status === 'string' && 
         ['generated', 'pending', 'confirmed', 'expired', 'cancelled', 'failed'].includes(status);
};
// =====================================================
// 🎯 INTERFACES DEL HOOK
// =====================================================
export interface UseMercantilP2CState {
  currentTransaction: MercantilP2CTransaction | null;
  isLoading: boolean;
  isSuccess: boolean;
  isExpired: boolean;
  isPending: boolean;
  hasError: boolean;
  timeRemaining: number;
  timeElapsed: number;
  error: string | null;
  errorCode: string | null;
  isWebSocketConnected: boolean;
  isGeneratingQR: boolean;
  isCheckingStatus: boolean;
  isCancelling: boolean;
}
export interface UseMercantilP2CActions {
  generateQR: (data: P2CPaymentRequest) => Promise<void>;
  checkStatus: () => Promise<void>;
  cancelTransaction: () => Promise<void>;
  reset: () => void;
  clearError: () => void;
  subscribeToUpdates: (callback: (data: P2CWebSocketData) => void) => () => void;
}
export interface UseMercantilP2CReturn extends UseMercantilP2CState, UseMercantilP2CActions {}
// =====================================================
// 🎯 CONFIGURACIÓN Y CONSTANTES
// =====================================================
interface UseMercantilP2CConfig {
  pollingInterval?: number;
  maxPollingAttempts?: number;
  qrGenerationTimeout?: number;
  statusCheckTimeout?: number;
  enableWebSocket?: boolean;
  fallbackToPolling?: boolean;
  onQRGenerated?: (data: P2CPaymentResponse) => void;
  onStatusUpdate?: (data: P2CWebSocketData) => void;
  onPaymentConfirmed?: (transaction: MercantilP2CTransaction) => void;
  onPaymentExpired?: (transaction: MercantilP2CTransaction) => void;
  onError?: (error: string, code?: string) => void;
}
const DEFAULT_CONFIG: Required<UseMercantilP2CConfig> = {
  pollingInterval: 3000,
  maxPollingAttempts: 50,
  qrGenerationTimeout: 30000,
  statusCheckTimeout: 15000,
  enableWebSocket: true,
  fallbackToPolling: true,
  onQRGenerated: () => {},
  onStatusUpdate: () => {},
  onPaymentConfirmed: () => {},
  onPaymentExpired: () => {},
  onError: () => {},
};
const validateConfig = (config: UseMercantilP2CConfig): void => {
  if (config.qrGenerationTimeout && config.qrGenerationTimeout < 5000) {
    P2CLogger.warn('qrGenerationTimeout debe ser mayor a 5 segundos');
  }
  if (config.pollingInterval && config.pollingInterval < 1000) {
    P2CLogger.warn('pollingInterval debe ser mayor a 1 segundo');
  }
};
// =====================================================
// 🎯 HOOK PRINCIPAL
// =====================================================
export function useMercantilP2C(config: UseMercantilP2CConfig = {}): UseMercantilP2CReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  validateConfig(finalConfig);
  P2CLogger.debug('Hook initialized', { config: finalConfig });
  const [currentTransaction, setCurrentTransaction] = useState<MercantilP2CTransaction | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState<boolean>(false);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef<number>(0);
  const wsUnsubscribeRef = useRef<(() => void) | null>(null);
  // =====================================================
  // 🎯 MUTATIONS Y QUERIES
  // =====================================================
  const generateQRMutation = useMutation({
    mutationFn: generateP2CQR,
    onSuccess: (data: P2CPaymentResponse) => {
      P2CLogger.debug('QR generation success', { data });
      
      if (data.success && data.transaction && validateTransaction(data.transaction)) {
        setCurrentTransaction(data.transaction);
        setTimeRemaining(calculateTimeRemaining(data.transaction.expires_at));
        setError(null);
        setErrorCode(null);
        finalConfig.onQRGenerated(data);
        startTimeTracking();
        
        if (finalConfig.enableWebSocket) {
          subscribeToWebSocketUpdates(data.transaction.merchant_order_id);
        } else if (finalConfig.fallbackToPolling) {
          startStatusPolling(data.transaction.merchant_order_id);
        }
      } else {
        const errorMsg = data.error || 'Error generando QR';
        P2CLogger.error('QR generation failed', { error: data, message: errorMsg });
        handleError(errorMsg, data.error_code);
      }
    },
    onError: (error: unknown) => {
      const errorMessage = isApiError(error) ? error.message : 'Error desconocido en la API';
      P2CLogger.error('QR generation API error', error);
      handleError(`Error en la API: ${errorMessage}`, 'API_ERROR');
    },
  });
  const { refetch: refetchStatus } = useQuery({
    queryKey: ['p2c_status', currentTransaction?.merchant_order_id],
    queryFn: () => currentTransaction ? checkP2CStatus(currentTransaction.merchant_order_id) : null,
    enabled: false,
    retry: false,
  });
  const cancelMutation = useMutation({
    mutationFn: () => {
      if (!currentTransaction?.merchant_order_id) {
        throw new Error('No hay transacción para cancelar');
      }
      return cancelP2CTransaction(currentTransaction.merchant_order_id);
    },
    onSuccess: () => {
      P2CLogger.debug('Transaction cancelled successfully');
      cleanup();
    },
    onError: (error: unknown) => {
      const errorMessage = isApiError(error) ? error.message : 'Error desconocido cancelando';
      P2CLogger.error('Transaction cancellation error', error);
      handleError(`Error cancelando: ${errorMessage}`, 'CANCEL_ERROR');
    },
  });
  // =====================================================
  // 🎯 FUNCIONES AUXILIARES
  // =====================================================
  const calculateTimeRemaining = useCallback((expiresAt?: string | null): number => {
    if (!expiresAt) return 0;
    try {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      return Math.max(0, Math.floor((expires - now) / 1000));
    } catch (error) {
      P2CLogger.error('Error calculating time remaining', error);
      return 0;
    }
  }, []);
  const startTimeTracking = useCallback(() => {
    elapsedTimerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    
    if (currentTransaction?.expires_at) {
      countdownTimerRef.current = setInterval(() => {
        const remaining = calculateTimeRemaining(currentTransaction.expires_at);
        setTimeRemaining(remaining);
        if (remaining <= 0) {
          handleExpiration();
        }
      }, 1000);
    }
  }, [currentTransaction, calculateTimeRemaining]);
  const startStatusPolling = useCallback((merchantOrderId: string) => {
    if (!finalConfig.fallbackToPolling) return;
    
    P2CLogger.debug('Starting status polling', { merchantOrderId });
    pollingAttemptsRef.current = 0;
    
    const poll = async () => {
      if (pollingAttemptsRef.current >= finalConfig.maxPollingAttempts) {
        P2CLogger.warn('Máximo intentos de polling alcanzado');
        return;
      }
      pollingAttemptsRef.current++;
      
      try {
        const result = await refetchStatus();
        if (result.data?.success) {
          updateTransactionStatus(result.data);
        }
      } catch (error) {
        P2CLogger.error('Error en polling', error);
      }
    };
    
    poll();
    pollingTimerRef.current = setInterval(poll, finalConfig.pollingInterval);
  }, [refetchStatus, finalConfig]);
  const subscribeToWebSocketUpdates = useCallback((merchantOrderId: string) => {
    if (!finalConfig.enableWebSocket) {
      P2CLogger.debug('WebSocket disabled, skipping subscription');
      return;
    }
    
    if (!isWebSocketConnected) {
      wsService.connect().catch(error => {
        P2CLogger.error('Error conectando WebSocket', error);
        if (finalConfig.fallbackToPolling) {
          startStatusPolling(merchantOrderId);
        }
      });
    }
    
    wsUnsubscribeRef.current = wsService.subscribeToP2CTransaction(
      merchantOrderId,
      (data: P2CWebSocketData) => {
        P2CLogger.debug('WebSocket update received', { data });
        
        // ✅ USANDO FUNCIÓN DE CONVERSIÓN SEGURA
        const paymentResponse = convertWebSocketDataToPaymentResponse(data, currentTransaction);
        updateTransactionStatus(paymentResponse);
        finalConfig.onStatusUpdate(data);
      }
    );
    
    const unsubscribeConnected = wsService.addEventListener('connected', () => {
      P2CLogger.debug('WebSocket connected');
      setIsWebSocketConnected(true);
    });
    
    const unsubscribeDisconnected = wsService.addEventListener('disconnected', () => {
      P2CLogger.debug('WebSocket disconnected');
      setIsWebSocketConnected(false);
      if (finalConfig.fallbackToPolling) {
        startStatusPolling(merchantOrderId);
      }
    });
    
    return () => {
      wsUnsubscribeRef.current?.();
      unsubscribeConnected();
      unsubscribeDisconnected();
    };
  }, [isWebSocketConnected, finalConfig, startStatusPolling, currentTransaction]);
  // ✅ CORREGIDO: SIN ERRORES DE TIPO
  const updateTransactionStatus = useCallback((statusData: P2CPaymentResponse) => {
    if (!currentTransaction) {
      P2CLogger.warn('No current transaction to update');
      return;
    }
    
    P2CLogger.debug('Updating transaction status', { statusData, currentTransaction });
    
    if (statusData.transaction && validateTransaction(statusData.transaction)) {
      const updatedTransaction: MercantilP2CTransaction = {
        ...currentTransaction,
        status: statusData.transaction.status,
        mercantil_transaction_id: statusData.transaction.mercantil_transaction_id,
        confirmed_at: statusData.transaction.confirmed_at,
        gateway_response_raw: statusData.transaction.gateway_response_raw,
      };
      setCurrentTransaction(updatedTransaction);
      
      if (statusData.transaction.status === 'confirmed') {
        P2CLogger.debug('Payment confirmed', updatedTransaction);
        finalConfig.onPaymentConfirmed(updatedTransaction);
        cleanup();
      } else if (statusData.transaction.status === 'expired') {
        P2CLogger.debug('Payment expired', updatedTransaction);
        finalConfig.onPaymentExpired(updatedTransaction);
        handleExpiration();
      }
    } else {
      // ✅ USANDO FUNCIÓN DE VALIDACIÓN SEGURA
      if (isValidStatus(statusData.status)) {
        const updatedTransaction: MercantilP2CTransaction = {
          ...currentTransaction,
          status: statusData.status,
        };
        setCurrentTransaction(updatedTransaction);
        
        if (statusData.status === 'confirmed') {
          const callbackData = createCallbackData(statusData);
          finalConfig.onStatusUpdate(callbackData);
        } else if (statusData.status === 'expired') {
          const callbackData = createCallbackData(statusData);
          finalConfig.onStatusUpdate(callbackData);
          handleExpiration();
        }
      }
    }
  }, [currentTransaction, finalConfig]);
  const handleError = useCallback((errorMessage: string, code?: string) => {
    P2CLogger.error('Handling error', { errorMessage, code });
    setError(errorMessage);
    setErrorCode(code || null);
    finalConfig.onError(errorMessage, code);
  }, [finalConfig]);
  const handleExpiration = useCallback(() => {
    if (currentTransaction) {
      P2CLogger.debug('Handling expiration', currentTransaction);
      finalConfig.onPaymentExpired(currentTransaction);
      setCurrentTransaction(prev => prev ? { ...prev, status: 'expired' } : null);
    }
    stopCountdown();
  }, [currentTransaction, finalConfig]);
  const cleanup = useCallback(() => {
    P2CLogger.debug('Cleaning up resources');
    
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
    
    wsUnsubscribeRef.current?.();
    wsUnsubscribeRef.current = null;
    pollingAttemptsRef.current = 0;
  }, []);
  const stopCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);
  // =====================================================
  // 🎯 ACCIONES PÚBLICAS
  // =====================================================
  const generateQR = useCallback(async (data: P2CPaymentRequest) => {
    P2CLogger.debug('Generating QR', data);
    cleanup();
    
    try {
      await generateQRMutation.mutateAsync(data);
    } catch (error) {
      P2CLogger.error('Generate QR exception', error);
    }
  }, [generateQRMutation, cleanup]);
  const checkStatus = useCallback(async () => {
    if (!currentTransaction?.merchant_order_id) {
      P2CLogger.warn('No transaction to check status');
      return;
    }
    
    P2CLogger.debug('Checking status', { merchantOrderId: currentTransaction.merchant_order_id });
    
    try {
      const result = await refetchStatus();
      if (result.data?.success) {
        updateTransactionStatus(result.data);
      }
    } catch (error) {
      const errorMessage = isApiError(error) ? error.message : 'Error desconocido verificando estado';
      P2CLogger.error('Status check error', error);
      handleError(`Error verificando estado: ${errorMessage}`, 'STATUS_CHECK_ERROR');
    }
  }, [currentTransaction, refetchStatus, updateTransactionStatus, handleError]);
  const cancelTransaction = useCallback(async () => {
    if (!currentTransaction) {
      P2CLogger.warn('No transaction to cancel');
      return;
    }
    
    P2CLogger.debug('Cancelling transaction', { merchantOrderId: currentTransaction.merchant_order_id });
    
    try {
      await cancelMutation.mutateAsync();
    } catch (error) {
      const errorMessage = isApiError(error) ? error.message : 'Error desconocido cancelando';
      P2CLogger.error('Cancel transaction exception', error);
    }
  }, [cancelMutation, currentTransaction]);
  const reset = useCallback(() => {
    P2CLogger.debug('Resetting hook state');
    cleanup();
    setCurrentTransaction(null);
    setTimeRemaining(0);
    setTimeElapsed(0);
    setError(null);
    setErrorCode(null);
  }, [cleanup]);
  const clearError = useCallback(() => {
    setError(null);
    setErrorCode(null);
  }, []);
  const subscribeToUpdates = useCallback((callback: (data: P2CWebSocketData) => void) => {
    if (!currentTransaction?.merchant_order_id) {
      P2CLogger.warn('No transaction to subscribe to');
      return () => {};
    }
    
    P2CLogger.debug('Subscribing to manual updates');
    return wsService.subscribeToP2CTransaction(
      currentTransaction.merchant_order_id,
      callback
    );
  }, [currentTransaction?.merchant_order_id]);
  // =====================================================
  // 🎯 EFECTOS DE LIMPIEZA
  // =====================================================
  useEffect(() => {
    return cleanup;
  }, [cleanup]);
  useEffect(() => {
    const unsubscribe = wsService.addEventListener('connected', () => {
      P2CLogger.debug('WebSocket connected event');
      setIsWebSocketConnected(true);
    });
    
    const unsubscribeDisconnected = wsService.addEventListener('disconnected', () => {
      P2CLogger.debug('WebSocket disconnected event');
      setIsWebSocketConnected(false);
    });
    
    return () => {
      unsubscribe();
      unsubscribeDisconnected();
    };
  }, []);
  // =====================================================
  // 🎯 ESTADOS CALCULADOS
  // =====================================================
  const isLoading = generateQRMutation.isPending;
  const isGeneratingQR = generateQRMutation.isPending;
  const isCheckingStatus = false;
  const isCancelling = cancelMutation.isPending;
  const isSuccess = currentTransaction?.status === 'confirmed';
  const isExpired = currentTransaction?.status === 'expired';
  const isPending = currentTransaction?.status === 'pending' || currentTransaction?.status === 'generated';
  const hasError = !!error;
  return {
    currentTransaction,
    isLoading,
    isSuccess,
    isExpired,
    isPending,
    hasError,
    timeRemaining,
    timeElapsed,
    error,
    errorCode,
    isWebSocketConnected,
    isGeneratingQR,
    isCheckingStatus,
    isCancelling,
    generateQR,
    checkStatus,
    cancelTransaction,
    reset,
    clearError,
    subscribeToUpdates,
  };
}
export default useMercantilP2C;
export function useMercantilP2CBasic() {
  return useMercantilP2C({
    enableWebSocket: true,
    fallbackToPolling: true,
    pollingInterval: 3000,
  });
}
export const P2CUtils = {
  formatTime: (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },
  
  formatAmount: (amount: number | string): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
    }).format(num);
  },
  
  getStatusColor: (status: string): string => {
    switch (status) {
      case 'confirmed': return 'text-emerald-500';
      case 'pending': return 'text-yellow-500';
      case 'expired': return 'text-red-500';
      case 'failed': return 'text-red-600';
      case 'cancelled': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  },
  
  getStatusIcon: (status: string) => {
    switch (status) {
      case 'confirmed': return '✓';
      case 'pending': return '⏳';
      case 'expired': return '⏰';
      case 'failed': return '✗';
      case 'cancelled': return '⊗';
      default: return '?';
    }
  },
} as const;