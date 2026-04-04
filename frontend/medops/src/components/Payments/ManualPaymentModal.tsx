// src/components/Payments/ManualPaymentModal.tsx
import React, { useState, useRef } from 'react';
import { 
  XMarkIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  CreditCardIcon,
  ArrowPathIcon,
  PhotoIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/api/client';
import { VENEZUELAN_BANKS } from '@/constants/banks';
interface ManualPaymentModalProps {
  open: boolean;
  chargeOrderId: number;
  expectedAmount: number;
  onVerificationSuccess: (data: any) => void;
  onClose: () => void;
}
interface ManualPaymentData {
  reference_number: string;
  bank_name: string;
  phone: string;
  national_id: string;
  amount_bs: string;
  payment_date: string;
  notes: string;
}
interface OCRResult {
  success: boolean;
  data?: {
    banco?: string;
    monto?: string;
    referencia?: string;
    telefono?: string;
    fecha?: string;
  };
  raw_text?: string;
  confianza?: number;
  error?: string;
}
const ManualPaymentModal: React.FC<ManualPaymentModalProps> = ({
  open,
  chargeOrderId,
  expectedAmount,
  onVerificationSuccess,
  onClose
}) => {
  const [formData, setFormData] = useState<ManualPaymentData>({
    reference_number: '',
    bank_name: '',
    phone: '',
    national_id: '',
    amount_bs: expectedAmount.toFixed(2),
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setSubmitError("La imagen no puede superar 2MB");
        return;
      }
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setSubmitError("Solo se permiten imágenes PNG o JPEG");
        return;
      }
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setSubmitError("");
      setOcrResult(null);
    }
  };
  const handleOCR = async () => {
    if (!screenshot) {
      setSubmitError("Primero sube una captura de pago");
      return;
    }
    setIsOCRLoading(true);
    setSubmitError(null);
    setOcrResult(null);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('image', screenshot);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/ocr/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`
        },
        body: formDataToSend
      });
      const result = await response.json();
      setOcrResult(result);
      if (result.success && result.data) {
        const data = result.data;
        
        if (data.banco) {
          const bank = VENEZUELAN_BANKS.find(b => 
            b.name.toLowerCase().includes(data.banco!.toLowerCase()) ||
            data.banco!.toLowerCase().includes(b.code.toLowerCase())
          );
          if (bank) {
            setFormData(prev => ({ ...prev, bank_name: bank.code }));
          }
        }
        if (data.monto) {
          const cleanMonto = data.monto.replace(/[.,]/g, '');
          setFormData(prev => ({ ...prev, amount_bs: cleanMonto }));
        }
        if (data.referencia) {
          setFormData(prev => ({ ...prev, reference_number: data.referencia! }));
        }
        if (data.telefono) {
          setFormData(prev => ({ ...prev, phone: data.telefono! }));
        }
        if (data.fecha) {
          setFormData(prev => ({ ...prev, payment_date: data.fecha! }));
        }
      }
    } catch (error: any) {
      setSubmitError(error.message || "Error al procesar OCR");
    } finally {
      setIsOCRLoading(false);
    }
  };
  const handleClearScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    setOcrResult(null);
  };
  const handleInputChange = (field: keyof ManualPaymentData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSubmitError(null);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reference_number.trim()) {
      setSubmitError('Número de referencia requerido');
      return;
    }
    
    if (!formData.bank_name) {
      setSubmitError('Banco origen requerido');
      return;
    }
    
    if (!formData.phone.trim()) {
      setSubmitError('Teléfono requerido');
      return;
    }
    
    if (!formData.national_id.trim()) {
      setSubmitError('Cédula requerida');
      return;
    }
    
    if (!formData.amount_bs || parseFloat(formData.amount_bs) <= 0) {
      setSubmitError('Monto inválido');
      return;
    }
    
    if (parseFloat(formData.amount_bs) < expectedAmount) {
      setSubmitError(`El monto debe ser al menos Bs ${expectedAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`);
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const amountBs = parseFloat(formData.amount_bs);
      const payload: any = {
        charge_order: chargeOrderId,
        amount_bs: amountBs,
        amount_usd: amountBs,
        method: 'transfer',
        reference_number: formData.reference_number,
        bank_name: formData.bank_name,
        phone: formData.phone,
        national_id: formData.national_id,
        payment_date: formData.payment_date,
        notes: formData.notes,
        manual_verification: true,
        reason: 'API_CONNECTION_DOWN'
      };
      if (screenshot) {
        const formDataToSend = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          formDataToSend.append(key, String(value));
        });
        formDataToSend.append('screenshot', screenshot);
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${localStorage.getItem('authToken')}`
          },
          body: formDataToSend
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Error al registrar pago');
        }
        const data = await response.json();
        onVerificationSuccess(data);
        onClose();
      } else {
        const response = await apiFetch('/api/payments/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        
        if (response) {
          onVerificationSuccess(response);
          onClose();
        }
      }
    } catch (error: any) {
      setSubmitError(error.message || 'Error al registrar pago');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleClose = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
    setOcrResult(null);
    setSubmitError(null);
    onClose();
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1b] border border-white/15 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/15 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" />
            <h2 className="text-[12px] font-semibold text-white">
              Registrar Pago Manual
            </h2>
          </div>
          <button 
            onClick={handleClose}
            className="text-white/40 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-3 border-b border-white/10 bg-amber-500/5">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] text-amber-400/80">
              Pendiente de verificación
            </span>
          </div>
        </div>
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
              Monto a Pagar
            </span>
            <span className="text-xl font-semibold text-blue-400">
              Bs {expectedAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-2 block">
              Captura de pago
            </label>
            <div className="border-2 border-dashed border-white/15 rounded-lg p-4 text-center hover:border-white/30 transition-colors">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleScreenshotChange}
                className="hidden"
                id="doctor-screenshot-upload"
                ref={fileInputRef}
              />
              <label htmlFor="doctor-screenshot-upload" className="cursor-pointer">
                <PhotoIcon className="w-8 h-8 mx-auto text-white/20 mb-2" />
                <p className="text-[11px] text-white/40">
                  {screenshot ? screenshot.name : "Subir captura de pantalla"}
                </p>
                <p className="text-[9px] text-white/20 mt-1">
                  PNG o JPG hasta 2MB
                </p>
              </label>
            </div>
            
            {screenshotPreview && (
              <div className="mt-3 relative">
                <img 
                  src={screenshotPreview} 
                  alt="Preview" 
                  className="h-32 w-full object-contain rounded-lg border border-white/10"
                />
                <button
                  type="button"
                  onClick={handleClearScreenshot}
                  className="absolute top-2 right-2 bg-red-500/80 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
                
                <button
                  type="button"
                  onClick={handleOCR}
                  disabled={isOCRLoading}
                  className="absolute bottom-2 right-2 flex items-center gap-1 px-2.5 py-1.5 bg-purple-500/80 text-white text-[9px] font-medium rounded-lg hover:bg-purple-500 disabled:opacity-50 transition-colors"
                >
                  {isOCRLoading ? (
                    <ArrowPathIcon className="w-3 h-3 animate-spin" />
                  ) : (
                    <SparklesIcon className="w-3 h-3" />
                  )}
                  {isOCRLoading ? "Procesando..." : "OCR"}
                </button>
              </div>
            )}
            
            {ocrResult && (
              <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-medium text-purple-300">
                    Resultado OCR
                  </span>
                  {ocrResult.confianza && (
                    <span className="text-[8px] text-purple-400/60">
                      Confianza: {Math.round(ocrResult.confianza * 100)}%
                    </span>
                  )}
                </div>
                {ocrResult.success ? (
                  <div className="space-y-1">
                    {ocrResult.data?.banco && <p className="text-[9px] text-white/50">Banco: {ocrResult.data.banco}</p>}
                    {ocrResult.data?.monto && <p className="text-[9px] text-white/50">Monto: Bs {ocrResult.data.monto}</p>}
                    {ocrResult.data?.referencia && <p className="text-[9px] text-white/50">Referencia: {ocrResult.data.referencia}</p>}
                    {ocrResult.data?.telefono && <p className="text-[9px] text-white/50">Teléfono: {ocrResult.data.telefono}</p>}
                  </div>
                ) : (
                  <p className="text-[9px] text-red-400">{ocrResult.error}</p>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
              Banco emisor
            </label>
            <select
              value={formData.bank_name}
              onChange={(e) => handleInputChange('bank_name', e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all"
              required
            >
              <option value="">Seleccionar banco</option>
              {VENEZUELAN_BANKS.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
              Teléfono del pagador
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="04121234567"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
              Cédula del pagador
            </label>
            <input
              type="text"
              value={formData.national_id}
              onChange={(e) => handleInputChange('national_id', e.target.value)}
              placeholder="V-12345678"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
              Número de referencia
            </label>
            <input
              type="text"
              value={formData.reference_number}
              onChange={(e) => handleInputChange('reference_number', e.target.value)}
              placeholder="12345678901234567890"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/30"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
                Monto (Bs)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount_bs}
                onChange={(e) => handleInputChange('amount_bs', e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
                Fecha de pago
              </label>
              <input
                type="date"
                value={formData.payment_date}
                onChange={(e) => handleInputChange('payment_date', e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all"
                style={{colorScheme: 'dark'}}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
              Notas adicionales
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/15 rounded-lg text-[12px] text-white/80 focus:outline-none focus:border-emerald-500/50 transition-all resize-none placeholder:text-white/30"
              placeholder="Notas adicionales..."
            />
          </div>
          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span className="text-[10px] text-red-400">{submitError}</span>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-emerald-500/15 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-lg border border-emerald-500/25"
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  Registrar Pago
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="py-2.5 px-5 bg-white/5 text-white/50 text-[11px] font-medium hover:bg-white/10 hover:text-white/70 transition-all rounded-lg"
            >
              Cancelar
            </button>
          </div>
        </form>
        <div className="px-6 py-3 border-t border-white/10 bg-white/5 flex items-center justify-center gap-2">
          <CreditCardIcon className="w-4 h-4 text-blue-400/30" />
          <span className="text-[8px] text-white/20 uppercase tracking-wider">
            Pendiente de verificación
          </span>
        </div>
      </div>
    </div>
  );
};
export default ManualPaymentModal;