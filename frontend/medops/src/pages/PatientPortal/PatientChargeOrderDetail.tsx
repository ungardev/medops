// src/pages/PatientPortal/PatientChargeOrderDetail.tsx
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/Common/PageHeader";
import { usePatientChargeOrderDetail } from "@/hooks/patient/usePatientChargeOrders";
import { useRegisterPayment } from "@/hooks/patient/useRegisterPayment";
import { usePatientPaymentMethod } from "@/hooks/patient/usePatientPaymentMethod";
import { patientClient } from "@/api/patient/client";
import { VENEZUELAN_BANKS } from "@/constants/banks";
import { Loader2 } from "lucide-react";
import { 
  ArrowLeftIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  PhotoIcon,
  SparklesIcon,
  ArrowPathIcon
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
export default function PatientChargeOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orderId = Number(id);
  
  const { data: order, isLoading, error } = usePatientChargeOrderDetail(orderId);
  const registerPayment = useRegisterPayment();
  const { data: paymentMethod } = usePatientPaymentMethod();
  
  const [showModal, setShowModal] = useState(false);
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
  const [successMessage, setSuccessMessage] = useState("");
  
  const hasPendingPayments = order?.payments?.some((p: any) => p.status === 'pending') ?? false;
  
  // ✅ NUEVO: Obtener datos bancarios del doctor desde el backend
  const doctorData = order?.doctor as any;
  
  useEffect(() => {
    if (showModal && paymentMethod) {
      setFormData(prev => ({
        ...prev,
        phone: prev.phone || paymentMethod.mobile_phone || '',
        national_id: prev.national_id || paymentMethod.mobile_national_id || '',
        bank_code: prev.bank_code || paymentMethod.preferred_bank || '',
      }));
    }
  }, [showModal, paymentMethod]);
  
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
          const cleanMonto = data.monto.replace(/[.,]/g, '');
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
  
  const handleCloseModal = () => {
    setShowModal(false);
    setScreenshot(null);
    setScreenshotPreview(null);
    setOcrResult(null);
    setFormError("");
    setSuccessMessage("");
  };
  
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");
    
    if (!formData.bank_code || !formData.phone || !formData.national_id || !formData.reference || !formData.amount_bs) {
      setFormError("Todos los campos son requeridos");
      return;
    }
    
    const amountBs = parseFloat(formData.amount_bs.replace(/,/g, '.'));
    const minRequired = order?.min_amount_bs || 0;
    
    if (amountBs < minRequired) {
      setFormError(`El monto debe ser igual o mayor a Bs ${minRequired.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`);
      return;
    }
    
    try {
      const result = await registerPayment.mutateAsync({
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
      
      setSuccessMessage(result.payment.message);
      handleCloseModal();
      setFormData({ bank_code: "", phone: "", national_id: "", reference: "", amount_bs: "" });
    } catch (err: any) {
      setFormError(err.response?.data?.error || "Error al registrar el pago");
    }
  };
  
  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );
  
  if (error || !order) return (
    <div className="p-8 text-center">
      <p className="text-red-500">Orden no encontrada</p>
      <button onClick={() => navigate("/patient/payments")} className="text-white/60 underline">
        Volver a pagos
      </button>
    </div>
  );
  
  const total = order.total_ves || order.total * order.bcv_rate;
  const paid = order.payments.reduce((acc: number, p: any) => acc + (p.amount_ves || p.amount * (p.exchange_rate_bcv || order.bcv_rate)), 0);
  const balance = order.balance_due_ves || order.balance_due * order.bcv_rate;
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "MIS PAGOS", path: "/patient/payments" },
          { label: `ORDEN #${order.id}`, active: true }
        ]}
        stats={[
          { 
            label: "STATUS", 
            value: order.status_display?.toUpperCase() || order.status.toUpperCase(), 
            color: order.status === 'paid' ? "text-emerald-400" : "text-amber-500"
          },
          { 
            label: "BALANCE", 
            value: `Bs ${balance.toLocaleString('es-VE', { minimumFractionDigits: 0 })}`, 
            color: balance > 0 ? "text-red-400" : "text-emerald-400"
          },
          { 
            label: "BCV_HOY", 
            value: order.bcv_rate.toLocaleString('es-VE', { minimumFractionDigits: 2 }), 
            color: "text-purple-400"
          },
          ...(hasPendingPayments ? [{
            label: "VERIFICACION",
            value: "EN CURSO",
            color: "text-amber-400"
          }] : [])
        ]}
        actions={
          <button 
            onClick={() => navigate("/patient/payments")} 
            className="flex items-center gap-2 px-4 py-2 border border-white/10 text-[9px] font-mono hover:bg-white/5 uppercase transition-all bg-white/[0.02]"
          >
            <ArrowLeftIcon className="w-3 h-3" /> Volver
          </button>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
        {[
          { label: "TOTAL", val: total, color: "text-white" },
          { label: "PAGADO", val: paid, color: "text-emerald-400" },
          { label: "PENDIENTE", val: balance, color: balance > 0 ? "text-red-400" : "text-emerald-400" }
        ].map((s: any, i: number) => (
          <div key={i} className="bg-[#111] p-6">
            <p className="text-[8px] font-black tracking-[0.3em] text-white/40 uppercase mb-2">{s.label}</p>
            <p className={`text-2xl font-mono font-bold ${s.color}`}>
              Bs {s.val.toLocaleString('es-VE', { minimumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-white/40" />
              <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">Servicios</h3>
            </div>
            <div className="border border-white/5 bg-white/[0.01] overflow-hidden rounded-sm">
              <table className="w-full text-left font-mono">
                <thead className="bg-white/5 text-[9px] text-white/40 uppercase tracking-widest">
                  <tr>
                    <th className="p-4 font-black">CÓDIGO</th>
                    <th className="p-4 font-black">DESCRIPCIÓN</th>
                    <th className="p-4 text-right font-black">CANT</th>
                    <th className="p-4 text-right font-black">UNIT</th>
                    <th className="p-4 text-right font-black">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[11px]">
                  {order.items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 text-blue-400 font-bold">{item.code}</td>
                      <td className="p-4 text-white/60 uppercase">{item.description}</td>
                      <td className="p-4 text-right text-white/40">{item.qty}</td>
                      <td className="p-4 text-right text-white/40">Bs {(item.unit_price_ves || item.unit_price * order.bcv_rate).toLocaleString('es-VE', { minimumFractionDigits: 0 })}</td>
                      <td className="p-4 text-right font-bold text-white">Bs {(item.subtotal_ves || item.subtotal * order.bcv_rate).toLocaleString('es-VE', { minimumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">
                Historial de Pagos
                {hasPendingPayments && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                    <span className="text-amber-400 text-[8px]">Actualizando cada 10s</span>
                  </span>
                )}
              </h3>
            </div>
            {order.payments.length === 0 ? (
              <div className="p-6 text-center text-white/30 text-[10px] font-mono">
                No hay pagos registrados
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {order.payments.map((payment: any) => {
                  const amountBs = payment.amount_ves || (payment.amount * (payment.exchange_rate_bcv || order.bcv_rate));
                  
                  return (
                    <div key={payment.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-white text-[10px] font-bold">Pago #{payment.id}</p>
                        <p className="text-white/40 text-[9px] font-mono">
                          {payment.received_at || "—"}
                          {payment.exchange_rate_bcv && (
                            <span className="text-purple-400 ml-2">
                              (BCV: {payment.exchange_rate_bcv.toLocaleString('es-VE')})
                            </span>
                          )}
                        </p>
                        {payment.status === 'rejected' && payment.verification_notes && (
                          <p className="text-red-400 text-[8px] mt-1">
                            Rechazado: {payment.verification_notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold">Bs {amountBs.toLocaleString('es-VE', { minimumFractionDigits: 0 })}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <p className="text-white/40 text-[8px] uppercase">
                            {payment.method_display || payment.method} - {payment.status_display || payment.status}
                          </p>
                          {payment.verification_type && (
                            <span className={`text-[7px] px-1.5 py-0.5 rounded-sm ${
                              payment.verification_type === 'automatic' 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {payment.verification_type === 'automatic' ? 'AUTO' : 'REVISION'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
        
        <div className="lg:col-span-4 space-y-8">
          {/* ✅ NUEVO: Sección de datos del receptor para pagar */}
          {doctorData && order.status !== 'paid' && (
            <section className="p-6 bg-emerald-500/[0.03] border border-emerald-500/20 space-y-4 rounded-sm">
              <h3 className="text-[9px] font-black tracking-[0.2em] uppercase text-emerald-400/80">Pagar a</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/50 text-[10px]">Nombre</span>
                  <span className="text-white text-[11px] font-bold">{doctorData.name}</span>
                </div>
                {doctorData.bank_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-[10px]">Banco</span>
                    <span className="text-white text-[11px] font-bold">{doctorData.bank_name}</span>
                  </div>
                )}
                {doctorData.bank_rif && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-[10px]">Cédula/RIF</span>
                    <span className="text-white text-[11px] font-bold font-mono">{doctorData.bank_rif}</span>
                  </div>
                )}
                {doctorData.bank_phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-[10px]">Teléfono</span>
                    <span className="text-white text-[11px] font-bold font-mono">{doctorData.bank_phone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-emerald-500/20">
                  <span className="text-white/50 text-[10px]">Monto a pagar</span>
                  <span className="text-emerald-400 text-[14px] font-bold">Bs {balance.toLocaleString('es-VE', { minimumFractionDigits: 0 })}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const data = [
                    `Pagar a: ${doctorData.name}`,
                    doctorData.bank_name ? `Banco: ${doctorData.bank_name}` : '',
                    doctorData.bank_rif ? `Cédula: ${doctorData.bank_rif}` : '',
                    doctorData.bank_phone ? `Teléfono: ${doctorData.bank_phone}` : '',
                    `Monto: Bs ${balance.toLocaleString('es-VE', { minimumFractionDigits: 0 })}`
                  ].filter(Boolean).join('\n');
                  navigator.clipboard.writeText(data);
                }}
                className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-emerald-500/20 transition-all"
              >
                Copiar Datos para Pagar
              </button>
            </section>
          )}
          
          {order.status !== 'paid' && order.status !== 'void' && order.status !== 'waived' && (
            <section className="p-6 bg-white/[0.02] border border-white/5 space-y-4 rounded-sm">
              <h3 className="text-[9px] font-black tracking-[0.2em] uppercase text-white/40">Operaciones</h3>
              <button 
                onClick={() => setShowModal(true)}
                className="w-full flex items-center justify-between p-4 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
              >
                registrar Mi Pago <PlusIcon className="w-4 h-4" />
              </button>
            </section>
          )}
          
          {order.status === 'paid' && (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-center">
              <CheckCircleIcon className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-emerald-400 font-bold uppercase text-[10px]">Orden Pagada</p>
            </div>
          )}
        </div>
      </div>
      
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#111] border border-white/10 rounded-sm w-full max-w-md max-h-[90vh] overflow-y-auto my-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="text-[12px] font-black uppercase tracking-wider">Registrar Pago - Orden #{order.id}</h3>
              <button onClick={handleCloseModal} className="text-white/40 hover:text-white">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitPayment} className="p-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 text-[10px]">
                  {formError}
                </div>
              )}
              
              {successMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-emerald-400 text-[10px]">
                  {successMessage}
                </div>
              )}
              
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
              
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Banco</label>
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
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Teléfono</label>
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
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Cédula</label>
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
                  Monto (Bs) - Mínimo: Bs {order.min_amount_bs?.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount_bs}
                  onChange={(e) => setFormData({ ...formData, amount_bs: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-emerald-500/50"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
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
      )}
    </div>
  );
}