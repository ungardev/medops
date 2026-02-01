// src/components/Payments/MercantilP2CPayment.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useMercantilP2C } from '../../hooks/payments/useMercantilP2C';
import { XMarkIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { MercantilP2CTransaction } from '../../types/payments';
interface MercantilP2CPaymentProps {
  orderId: number;
  amount: number;
  onSuccess: (transaction: MercantilP2CTransaction) => void;
  onError: (error: Error) => void;
  onClose: () => void;
}
// ✅ NUEVO: Función QR Manual sin dependencias externas
const generateQRCode = (text: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Usar QRCode API online para generar QR
    // Esto evita dependencias externas que causan problemas
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
    
    fetch(qrApiUrl)
      .then(response => response.json())
      .then(data => {
        if (data.qrDataURL) {
          resolve(data.qrDataURL);
        } else {
          reject(new Error('Failed to generate QR code'));
        }
      })
      .catch(error => {
        reject(new Error(`QR generation error: ${error.message}`));
      });
  });
};
const MercantilP2CPayment: React.FC<MercantilP2CPaymentProps> = ({
  orderId,
  amount,
  onSuccess,
  onError,
  onClose
}) => {
  // Estados del componente
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'verifying' | 'paid'>('pending');
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  // Hook P2C existente
  const {
    currentTransaction,
    isLoading,
    isGeneratingQR,
    generateQR,
    checkStatus,
    subscribeToUpdates
  } = useMercantilP2C({
    pollingInterval: 5000,
    maxPollingAttempts: 100,
    enableWebSocket: true,
    fallbackToPolling: true,
    onPaymentConfirmed: (transaction) => {
      setPaymentStatus('paid');
      onSuccess(transaction);
    },
    onError: (error) => {
      onError(new Error(error));
    }
  });
  // Generar QR al montar el componente
  useEffect(() => {
    handleGenerateQR();
  }, [orderId, amount]);
  // Suscripción a actualizaciones
  useEffect(() => {
    if (!currentTransaction?.merchant_order_id) return;
    const unsubscribe = subscribeToUpdates((data) => {
      if (data.status === 'confirmed') {
        setPaymentStatus('paid');
        if (currentTransaction) {
          onSuccess(currentTransaction);
        }
      }
    });
    return unsubscribe;
  }, [currentTransaction?.merchant_order_id, subscribeToUpdates, onSuccess]);
  // ✅ CORREGIDO: Generar QR con parámetros correctos
  const handleGenerateQR = async () => {
    setIsGenerating(true);
    setPaymentStatus('pending');
    
    try {
      await generateQR({
        institution_id: 1,
        amount: amount,
        charge_order_id: orderId
      });
      // ✅ Generar QR manual si hay datos
      if (currentTransaction?.merchant_order_id) {
        const qrText = currentTransaction.qr_code_data || currentTransaction.merchant_order_id;
        const qrUrl = await generateQRCode(qrText);
        setQrDataUrl(qrUrl);
      }
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsGenerating(false);
    }
  };
  // Verificación manual del médico
  const handleManualVerify = async () => {
    if (!currentTransaction?.merchant_order_id) return;
    
    setPaymentStatus('verifying');
    try {
      await checkStatus();
    } catch (error) {
      onError(error as Error);
      setPaymentStatus('pending');
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Pago P2C Mercantil</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* QR Code */}
        <div className="flex justify-center mb-4">
          {isGenerating || isGeneratingQR ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-2"></div>
              <p className="text-sm text-gray-600">Generando código QR...</p>
            </div>
          ) : qrDataUrl ? (
            <div className="bg-white p-4 rounded-lg shadow-inner">
              {/* ✅ NUEVO: Imagen QR generada manualmente */}
              <img 
                src={qrDataUrl}
                alt="QR Code para pago"
                className="w-48 h-48"
                style={{ imageRendering: 'crisp-edges' }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-32 w-32 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                <span className="text-gray-400">QR no disponible</span>
              </div>
              <button
                onClick={handleGenerateQR}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Reintentar generación
              </button>
            </div>
          )}
        </div>
        
        {/* Instructions */}
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600 mb-1">
            Escanee el código QR para pagar <span className="font-bold">${amount.toFixed(2)}</span>
          </p>
          <p className="text-xs text-gray-500">
            Pague cuando esté listo - Sin tiempo límite
          </p>
          {currentTransaction?.merchant_order_id && (
            <p className="text-xs text-gray-400 mt-1">
              Orden: {currentTransaction.merchant_order_id}
            </p>
          )}
        </div>
        
        {/* Status */}
        <div className={`text-center p-3 rounded-lg mb-4 transition-colors ${
          paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
          paymentStatus === 'verifying' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {paymentStatus === 'paid' ? (
            <div className="flex items-center justify-center gap-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="font-medium">✅ Pago Confirmado</span>
            </div>
          ) : paymentStatus === 'verifying' ? (
            <div className="flex items-center justify-center gap-2">
              <ClockIcon className="w-5 h-5 animate-pulse" />
              <span className="font-medium">⏳ Verificando...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <ClockIcon className="w-5 h-5" />
              <span className="font-medium">⏳ Esperando Pago</span>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
          {paymentStatus !== 'paid' && (
            <button
              onClick={handleManualVerify}
              disabled={paymentStatus === 'verifying'}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {paymentStatus === 'verifying' ? 'Verificando...' : 'Verificar Manualmente'}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
export default MercantilP2CPayment;