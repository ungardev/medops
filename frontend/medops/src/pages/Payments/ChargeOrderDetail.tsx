// src/pages/Payments/ChargeOrderDetail.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import PageHeader from "@/components/Common/PageHeader";
import PaymentList from "@/components/Payments/PaymentList";
import PaymentMethodSelectorModal from "@/components/Payments/PaymentMethodSelectorModal";
import CashPaymentModal from "@/components/Payments/CashPaymentModal";
import { useVerifyMobilePayment, type VerifyMobilePaymentData, VerifyMobilePaymentError } from '@/hooks/payments/useVerifyMobilePayment';
import ManualPaymentModal from '@/components/Payments/ManualPaymentModal';
import { useState } from "react";
import { ChargeOrder, ChargeOrderStatus } from "@/types/payments"; 
import { useInvalidateChargeOrders } from "@/hooks/payments/useInvalidateChargeOrders";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { apiFetch } from "@/api/client";
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon, 
  NoSymbolIcon, 
  GiftIcon, 
  PlusIcon,
  ClockIcon,
  UserIcon,
  HashtagIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";
interface Event {
  id: number;
  action: string;
  actor: string | null;
  timestamp: string;
  notes?: string | null | Record<string, any>;
}
export default function ChargeOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  const invalidateChargeOrders = useInvalidateChargeOrders();
  const { activeInstitution } = useInstitutions();
  
  const verifyMobilePayment = useVerifyMobilePayment({
    onSuccess: (data: VerifyMobilePaymentData) => {
      setToast({ 
        message: `Pago verificado: $${data.amount_verified} registrado exitosamente`, 
        type: "success" 
      });
      setShowManualModal(false);
      setVerificationError(null);
      invalidateChargeOrders(id);
    },
    onError: (error: VerifyMobilePaymentError) => {
      if (error.code === 'MERCANTIL_API_ERROR' || error.fallback_required) {
        setShowManualModal(true);
        setToast({ 
          message: "Error de conexión API. Registro manual requerido.", 
          type: "info" 
        });
      } else {
        setVerificationError(error.message);
        setToast({ 
          message: `Verificación fallida: ${error.error}`, 
          type: "error" 
        });
      }
    }
  });
  
  const handlePaymentMethodSelect = (paymentData: any) => {
    setShowPaymentSelector(false);
    
    if (paymentData.method === 'cash') {
      setShowCashModal(true);
    } else if (paymentData.method === 'mobile') {
      verifyMobilePayment.mutate({
        chargeOrderId: order!.id,
        expectedAmount: pending,
        timeWindowHours: 24
      });
    }
  };
  
  if (!id) return <div className="p-8 text-sm text-red-400">Error: ID de referencia inválido</div>;
  
  const { data: order, isLoading, error } = useQuery<ChargeOrder>({
    queryKey: ["charge-order", id],
    queryFn: async () => apiFetch<ChargeOrder>(`charge-orders/${id}/`),
  });
  
  const events: Event[] | null = null;
  
  const voidMutation = useMutation({
    mutationFn: async () => apiFetch<void>(`charge-orders/${id}/void/`, { method: "POST" }),
    onSuccess: () => invalidateChargeOrders(id),
  });
  const waiveMutation = useMutation({
    mutationFn: async () => apiFetch<void>(`charge-orders/${id}/waive/`, { method: "POST" }),
    onSuccess: () => invalidateChargeOrders(id),
  });
  
  const handleExport = async () => {
    if (!order?.id) return;
    try {
      const token = localStorage.getItem("authToken");
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE}/charge-orders/${order.id}/export/`, {
        headers: { ...(token ? { Authorization: `Token ${token}` } : {}) },
      });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ORD-${order.id}.pdf`;
      link.click();
    } catch (err) { alert("Error al exportar el comprobante"); }
  };
  
  if (isLoading) return <div className="p-8 animate-pulse text-sm text-white/30">Cargando datos...</div>;
  if (error || !order) return <div className="p-8 text-sm text-red-400">Orden no encontrada</div>;
  
  const total = order!.total_amount ?? order!.total ?? 0;
  const paid = order!.payments?.reduce((acc, p) => acc + Number(p.amount), 0) ?? 0;
  const pending = Number(total) - paid;
  
  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto">
      
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "Pagos", path: "/payments" },
          { 
            label: order!.institution?.name || "Institución",
            path: "#" 
          },
          { label: `Orden #${order!.id}`, active: true }
        ]}
        stats={[
          { 
            label: "Estado", 
            value: order!.status_display || order!.status, 
            color: order!.status === ChargeOrderStatus.PAID ? "text-emerald-400" : "text-amber-400" 
          },
          { 
            label: "Saldo", 
            value: `$${pending.toFixed(2)}`, 
            color: pending > 0 ? "text-red-400" : "text-emerald-400" 
          },
          { 
            label: "Institución",
            value: order!.institution?.name || "Ninguna",
            color: "text-white/60" 
          }
        ]}
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 border border-white/15 bg-white/5 text-[11px] font-medium hover:bg-white/10 transition-all rounded-lg">
              <ArrowLeftIcon className="w-4 h-4" /> Volver
            </button>
            
            {order!.institution && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/15 rounded-lg">
                <BuildingOfficeIcon className="w-4 h-4 text-white/30" />
                <span className="text-[10px] text-white/50">
                  {order!.institution.tax_id}
                </span>
              </div>
            )}
          </div>
        }
      />
      
      {order!.institution && (
        <div className="bg-white/5 border border-white/15 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BuildingOfficeIcon className="w-5 h-5 text-white/30" />
              <div>
                <h3 className="text-[12px] font-medium text-white/80">
                  {order!.institution.name}
                </h3>
                <p className="text-[9px] text-white/30">
                  RIF: {order!.institution.tax_id}
                </p>
              </div>
            </div>
            
            {activeInstitution && activeInstitution.id !== order!.institution.id && (
              <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                <span className="text-[9px] text-amber-400">
                  Institución diferente a la activa
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total", val: total, color: "text-white" },
          { label: "Pagado", val: paid, color: "text-emerald-400" },
          { label: "Pendiente", val: pending, color: pending > 0 ? "text-red-400" : "text-emerald-400" }
        ].map((s, i) => (
          <div key={i} className="bg-white/5 border border-white/15 rounded-lg p-5 hover:border-white/25 transition-colors">
            <p className="text-[9px] font-medium tracking-wider text-white/40 uppercase mb-2">
              {s.label}
            </p>
            <p className={`text-2xl font-semibold ${s.color}`}>${Number(s.val).toFixed(2)}</p>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <HashtagIcon className="w-5 h-5 text-white/30" />
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-white/60">Servicios</h3>
            </div>
            <div className="border border-white/15 bg-white/5 overflow-hidden rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[9px] text-white/40 uppercase tracking-wider">
                  <tr>
                    <th className="p-4 font-medium">Código</th>
                    <th className="p-4 font-medium">Descripción</th>
                    <th className="p-4 text-right font-medium">Cant</th>
                    <th className="p-4 text-right font-medium">Unit</th>
                    <th className="p-4 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[11px]">
                  {order!.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 text-blue-400 font-medium">{item.code}</td>
                      <td className="p-4 text-white/60">{item.description}</td>
                      <td className="p-4 text-right text-white/40">{item.qty}</td>
                      <td className="p-4 text-right text-white/40">${Number(item.unit_price).toFixed(2)}</td>
                      <td className="p-4 text-right font-medium text-white/80">${Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-white/60">Historial de Pagos</h3>
            </div>
            <PaymentList payments={order!.payments || []} />
          </section>
        </div>
        
        <div className="lg:col-span-4 space-y-8">
          <section className="p-5 bg-white/5 border border-white/15 space-y-4 rounded-lg">
            <h3 className="text-[10px] font-medium uppercase tracking-wider text-white/40">Operaciones</h3>
            <div className="grid grid-cols-1 gap-2">
              
              <button onClick={() => setShowPaymentSelector(true)} className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/15 transition-all group rounded-lg">
                Registrar Pago <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              </button>
              
              <button onClick={handleExport} className="flex items-center justify-between p-4 bg-white/5 border border-white/15 text-white/70 text-[11px] font-medium hover:bg-white/10 transition-all rounded-lg">
                Exportar Comprobante <DocumentArrowDownIcon className="w-4 h-4" />
              </button>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button 
                  onClick={() => voidMutation.mutate()} 
                  disabled={voidMutation.isPending} 
                  className="flex flex-col items-center justify-center p-4 bg-red-500/5 border border-red-500/15 text-red-400/60 text-[9px] font-medium hover:bg-red-500/10 hover:text-red-400 transition-all disabled:opacity-30 rounded-lg"
                >
                  <NoSymbolIcon className="w-4 h-4 mb-1" /> Anular Orden
                </button>
                <button 
                  onClick={() => waiveMutation.mutate()} 
                  disabled={waiveMutation.isPending} 
                  className="flex flex-col items-center justify-center p-4 bg-amber-500/5 border border-amber-500/15 text-amber-400/60 text-[9px] font-medium hover:bg-amber-500/10 hover:text-amber-400 transition-all disabled:opacity-30 rounded-lg"
                >
                  <GiftIcon className="w-4 h-4 mb-1" /> Exonerar Orden
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      {showPaymentSelector && (
        <PaymentMethodSelectorModal
          chargeOrderId={order!.id}
          expectedAmount={pending}
          onClose={() => setShowPaymentSelector(false)}
          onSuccess={handlePaymentMethodSelect}
        />
      )}
      
      {showCashModal && (
        <CashPaymentModal
          open={showCashModal}
          appointmentId={order!.appointment}
          chargeOrderId={order!.id}
          expectedAmount={pending}
          onClose={() => setShowCashModal(false)}
        />
      )}
      
      {showManualModal && (
        <ManualPaymentModal
          open={showManualModal}
          chargeOrderId={order!.id}
          expectedAmount={pending}
          onVerificationSuccess={() => {
            setShowManualModal(false);
            invalidateChargeOrders(id);
            setToast({ 
              message: "Pago manual registrado exitosamente", 
              type: "success" 
            });
          }}
          onClose={() => setShowManualModal(false)}
        />
      )}
      
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`flex items-center gap-3 px-4 py-3 border rounded-lg ${
            toast.type === "success" 
              ? 'bg-emerald-500/10 border-emerald-500/20' :
            toast.type === "error" 
              ? 'bg-red-500/10 border-red-500/20' 
              : 'bg-blue-500/10 border-blue-500/20'
          }`}>
            <span className={`text-[11px] font-medium ${
              toast.type === "success" 
                ? 'text-emerald-400' :
              toast.type === "error" 
                ? 'text-red-400' 
                : 'text-blue-400'
            }`}>
              {toast.message}
            </span>
            <button 
              onClick={() => setToast(null)}
              className="text-white/40 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}