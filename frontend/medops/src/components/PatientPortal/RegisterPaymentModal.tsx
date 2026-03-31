// src/components/PatientPortal/RegisterPaymentModal.tsx
import { useState, useRef, useEffect } from "react";
import { useRegisterPayment } from "@/hooks/patient/useRegisterPayment";
import { usePatientPaymentMethod } from "@/hooks/patient/usePatientPaymentMethod";
import { patientClient } from "@/api/patient/client";
import { VENEZUELAN_BANKS } from "@/constants/banks";
import { Loader2 } from "lucide-react";
import { 
  XMarkIcon,
  PhotoIcon,
  SparklesIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
interface OCRResult {
  success: boolean;
  data?: {
    banco?: string;
    monto?: string;
    referencia?: string;
    telefono?: string;
    cedula?: string;
    fecha?: string;
    hora?: string;
    receptor?: string;
  };
  raw_text?: string;
  confianza?: number;
  strategy?: string;
  error?: string;
}
interface RegisterPaymentModalProps {
  orderId: number;
  order: {
    id: number;
    min_amount_bs: number;
    bcv_rate: number;
    balance_due_ves: number;
  };
  doctorData: {
    name: string;
    bank_name?: string;
    bank_rif?: string;
    bank_phone?: string;
  };
  balance: number;
  onClose: () => void;
  onSuccess: () => void;
}
export default function RegisterPaymentModal({
  orderId,
  order,
  doctorData,
  balance,
  onClose,
  onSuccess
}: RegisterPaymentModalProps) {
  const registerPayment = useRegisterPayment();
  const { data: paymentMethod } = usePatientPaymentMethod();
  
  const [formData, setFormData] = useState({
    bank_code: "",
    phone: "",
    national_id: "",
    reference: "",
    amount_bs: "",
  });
  
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isOCRLoading, setIsOCRLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState("");
  
  // ✅ Pre-llenar con datos del paciente desde PatientSettings
  useEffect(() => {
    if (paymentMethod) {
      setFormData(prev => ({
        ...prev,
        phone: prev.phone || paymentMethod.mobile_phone || '',
        national_id: prev.national_id || paymentMethod.mobile_national_id || '',
        bank_code: prev.bank_code || paymentMethod.preferred_bank || '',
      }));
    }
  }, [paymentMethod]);
  
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError("La imagen no puede superar 2MB");
        return;
      }
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setFormError("Solo se permiten imágenes PNG o JPEG");
        return;
      }
      setScreenshot(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setFormError("");
      setOcrResult(null);
    }
  };
  
  const handleOCR = async () => {
    if (!screenshot) {
      setFormError("Primero sube una captura de pago");
      return;
    }
    setIsOCRLoading(true);
    setFormError("");
    setOcrResult(null);
    try {
      const response = await patientClient.processOCR(screenshot);
      const result = response.data as OCRResult;
      setOcrResult(result);
      
      if (result.success && result.data) {
        const data = result.data;
        
        if (data.banco) {
          const bank = VENEZUELAN_BANKS.find((b: any) => 
            b.name.toLowerCase().includes(data.banco!.toLowerCase()) ||
            data.banco!.toLowerCase().includes(b.code.toLowerCase())
          );
          if (bank) {
            setFormData(prev => ({ ...prev, bank_code: bank.code }));
          }
        }
        if (data.monto) {
          // ✅ FIX: Convertir formato venezolano (23.693,51) a americano (23693.51)
          let cleanMonto = data.monto;
          if (cleanMonto.includes(',')) {
            cleanMonto = cleanMonto.replace(/\./g, '').replace(',', '.');
          }
          setFormData(prev => ({ ...prev, amount_bs: cleanMonto }));
        }
        if (data.referencia) {
          setFormData(prev => ({ ...prev, reference: data.referencia! }));
        }
        if (data.telefono) {
          setFormData(prev => ({ ...prev, phone: data.telefono! }));
        }
        if (data.cedula) {
          setFormData(prev => ({ ...prev, national_id: data.cedula! }));
        }
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || "Error al procesar OCR");
    } finally {
      setIsOCRLoading(false);
    }
  };
  
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    
    if (!formData.bank_code || !formData.phone || !formData.national_id || !formData.reference || !formData.amount_bs) {
      setFormError("Todos los campos son requeridos");
      return;
    }
    
    // ✅ FIX: Soportar formato venezolano (23.693,51) y americano (23693.51)
    let cleanAmount = formData.amount_bs;
    if (cleanAmount.includes(',')) {
      cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
    }
    const amountBs = Math.round(parseFloat(cleanAmount) * 100) / 100;
    const minRequired = Math.round((order?.min_amount_bs || 0) * 100) / 100;
    
    if (isNaN(amountBs) || amountBs < minRequired) {
      setFormError(`El monto debe ser igual o mayor a Bs ${minRequired.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`);
      return;
    }
    
    try {
      await registerPayment.mutateAsync({
        orderId,
        data: {
          bank_code: formData.bank_code,
          phone: formData.phone,
          national_id: formData.national_id,
          reference: formData.reference,
          amount_bs: amountBs,
          screenshot: screenshot || undefined,
        }
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Error al registrar el pago");
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#111] border border-white/10 rounded-sm w-full max-w-md max-h-[90vh] overflow-y-auto my-auto">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-[12px] font-black uppercase tracking-wider">Registrar Pago - Orden #{orderId}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmitPayment} className="p-4 space-y-4">
          {/* ✅ Resumen de "Pagar a" dentro del modal */}
          <div className="p-4 bg-emerald-500/[0.03] border border-emerald-500/20 rounded-sm space-y-2">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400/80 mb-2">Pagar a</p>
            <div className="space-y-1">
              {doctorData.bank_name && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/50">Banco</span>
                  <span className="text-white font-bold">{doctorData.bank_name}</span>
                </div>
              )}
              {doctorData.bank_rif && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/50">Cédula</span>
                  <span className="text-white font-bold font-mono">{doctorData.bank_rif}</span>
                </div>
              )}
              {doctorData.bank_phone && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/50">Teléfono</span>
                  <span className="text-white font-bold font-mono">{doctorData.bank_phone}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] pt-2 border-t border-emerald-500/20">
                <span className="text-white/50">Monto</span>
                <span className="text-emerald-400 font-bold">Bs {balance.toLocaleString('es-VE', { minimumFractionDigits: 0 })}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const data = [
                  doctorData.bank_name ? `Banco: ${doctorData.bank_name}` : '',
                  doctorData.bank_rif ? `Cédula: ${doctorData.bank_rif}` : '',
                  doctorData.bank_phone ? `Teléfono: ${doctorData.bank_phone}` : '',
                  `Monto: Bs ${balance.toLocaleString('es-VE', { minimumFractionDigits: 0 })}`
                ].filter(Boolean).join('\n');
                navigator.clipboard.writeText(data);
              }}
              className="w-full py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-wider rounded-sm hover:bg-emerald-500/20 transition-all"
            >
              Copiar Datos del Receptor
            </button>
          </div>
          
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 text-[10px]">
              {formError}
            </div>
          )}
          
          {/* ✅ Upload de captura */}
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">
              Captura de pago
            </label>
            <div className="border-2 border-dashed border-white/20 rounded-sm p-4 text-center hover:border-white/40 transition-colors">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleScreenshotChange}
                className="hidden"
                id="screenshot-upload"
                ref={fileInputRef}
              />
              <label htmlFor="screenshot-upload" className="cursor-pointer">
                <PhotoIcon className="w-8 h-8 mx-auto text-white/30 mb-2" />
                <p className="text-[10px] text-white/50">
                  {screenshot ? screenshot.name : "Subir captura de pantalla"}
                </p>
                <p className="text-[8px] text-white/30 mt-1">
                  PNG o JPG hasta 2MB
                </p>
              </label>
            </div>
            
            {screenshotPreview && (
              <div className="mt-3 relative">
                <img 
                  src={screenshotPreview} 
                  alt="Preview" 
                  className="h-32 w-full object-contain rounded-sm border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setScreenshot(null);
                    setScreenshotPreview(null);
                    setOcrResult(null);
                  }}
                  className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 hover:bg-red-500"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
                
                <button
                  type="button"
                  onClick={handleOCR}
                  disabled={isOCRLoading}
                  className="absolute bottom-1 right-1 flex items-center gap-1 px-2 py-1 bg-purple-500/80 text-white text-[8px] font-bold uppercase rounded-sm hover:bg-purple-500 disabled:opacity-50"
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
              <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-purple-300 uppercase">
                    OCR Resultado
                    {ocrResult.strategy && (
                      <span className="ml-1 text-purple-400/60">({ocrResult.strategy})</span>
                    )}
                  </span>
                  {ocrResult.confianza && (
                    <span className={`text-[8px] ${
                      ocrResult.confianza >= 0.8 ? 'text-emerald-400' : 
                      ocrResult.confianza >= 0.5 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      Confianza: {Math.round(ocrResult.confianza * 100)}%
                    </span>
                  )}
                </div>
                {ocrResult.success ? (
                  <div className="grid grid-cols-2 gap-1">
                    {ocrResult.data?.banco && <p className="text-[8px] text-white/60">Banco: {ocrResult.data.banco}</p>}
                    {ocrResult.data?.monto && <p className="text-[8px] text-white/60">Monto: Bs {ocrResult.data.monto}</p>}
                    {ocrResult.data?.referencia && <p className="text-[8px] text-white/60">Ref: {ocrResult.data.referencia}</p>}
                    {ocrResult.data?.telefono && <p className="text-[8px] text-white/60">Tel: {ocrResult.data.telefono}</p>}
                    {ocrResult.data?.cedula && <p className="text-[8px] text-white/60">CI: {ocrResult.data.cedula}</p>}
                    {ocrResult.data?.fecha && <p className="text-[8px] text-white/60">Fecha: {ocrResult.data.fecha}</p>}
                    {ocrResult.data?.hora && <p className="text-[8px] text-white/60">Hora: {ocrResult.data.hora}</p>}
                    {ocrResult.data?.receptor && <p className="text-[8px] text-white/60 col-span-2">Receptor: {ocrResult.data.receptor}</p>}
                  </div>
                ) : (
                  <p className="text-[8px] text-red-400">{ocrResult.error}</p>
                )}
              </div>
            )}
          </div>
          
          {/* ✅ Formulario del emisor (paciente) */}
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Tu Banco (Emisor)</label>
            <select
              value={formData.bank_code}
              onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-emerald-500/50"
              required
            >
              <option value="">Seleccionar banco</option>
              {VENEZUELAN_BANKS.map((bank: any) => (
                <option key={bank.code} value={bank.code}>{bank.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Tu Teléfono (Emisor)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-emerald-500/50"
              placeholder="04121234567"
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Tu Cédula (Emisor)</label>
            <input
              type="text"
              value={formData.national_id}
              onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-emerald-500/50"
              placeholder="V-12345678"
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Referencia</label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-emerald-500/50"
              placeholder="Número de referencia"
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">
              Monto (Bs) - Mínimo: Bs {order.min_amount_bs?.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={formData.amount_bs}
              onChange={(e) => {
                // ✅ FIX: Permitir solo números, punto y coma
                const value = e.target.value.replace(/[^0-9.,]/g, '');
                setFormData({ ...formData, amount_bs: value });
              }}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-emerald-500/50"
              placeholder="23.693,51 o 23693.51"
              required
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 border border-white/20 text-white/60 text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={registerPayment.isPending}
              className="flex-1 px-6 py-2.5 bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-emerald-400 disabled:opacity-50"
            >
              {registerPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Registrar Pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}