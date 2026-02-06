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
  // ✅ 1. HOOKS DE ROUTER (PRIMERO SIEMPRE)
  const { id } = useParams();
  const navigate = useNavigate();
  
  // ✅ 2. HOOKS DE ESTADO (TODOS JUNTOS Y AL INICIO)
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  // ✅ 3. HOOKS PERSONALIZADOS
  const invalidateChargeOrders = useInvalidateChargeOrders();
  const { activeInstitution } = useInstitutions();
  
  // ✅ 4. HOOK DE VERIFICACIÓN MÓVIL REAL CORREGIDO
  const verifyMobilePayment = useVerifyMobilePayment({
    onSuccess: (data: VerifyMobilePaymentData) => {
      setToast({ 
        message: `✅ PAYMENT_VERIFIED: $${data.amount_verified} registered successfully`, 
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
          message: "⚠️ API_CONNECTION_DOWN: Manual registration required", 
          type: "info" 
        });
      } else {
        setVerificationError(error.message);
        setToast({ 
          message: `❌ VERIFICATION_FAILED: ${error.error}`, 
          type: "error" 
        });
      }
    }
  });
  
  // ✅ 5. HANDLERS DE SELECCIÓN DE MÉTODOS DE PAGO
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
  
  // ✅ 6. CONDICIONALES TEMPRANOS (DESPUÉS DE TODOS LOS HOOKS)
  if (!id) return <div className="p-8 text-[10px] font-mono text-red-500 uppercase tracking-widest">Error: Null_Reference_ID</div>;
  
  // ✅ 7. HOOKS DE DATOS
  const { data: order, isLoading, error } = useQuery<ChargeOrder>({
    queryKey: ["charge-order", id],
    queryFn: async () => apiFetch<ChargeOrder>(`charge-orders/${id}/`),
  });
  
  // ✅ 8. EVENTS CON TIPO CORREGIDO
  const events: Event[] | null = null; // TEMPORAL - Endpoint no existe
  
  // ✅ 9. MUTATIONS
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
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/charge-orders/${order.id}/export/`, {
        headers: { ...(token ? { Authorization: `Token ${token}` } : {}) },
      });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ORD-${order.id}.pdf`;
      link.click();
    } catch (err) { alert("EXPORT_FAILED: Server_Response_Error"); }
  };
  
  // ✅ 10. CONDICIONALES DE LOADING/ERROR (DESPUÉS DE TODOS LOS HOOKS)
  if (isLoading) return <div className="p-8 animate-pulse font-mono text-[10px] uppercase tracking-widest text-[var(--palantir-muted)]">Fetching_Object_Data...</div>;
  if (error || !order) return <div className="p-8 font-mono text-[10px] text-red-500">OBJECT_NOT_FOUND</div>;
  
  // ✅ NON-NULL ASSERTIONS DESPUÉS DEL EARLY RETURN
  const total = order!.total_amount ?? order!.total ?? 0;
  const paid = order!.payments?.reduce((acc, p) => acc + Number(p.amount), 0) ?? 0;
  const pending = Number(total) - paid;
  
  return (
    <div className="p-4 sm:p-8 space-y-8 bg-[var(--palantir-bg)] min-h-screen max-w-7xl mx-auto">
      
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "PAYMENTS", path: "/payments" },
          { 
            label: order!.institution?.name?.toUpperCase().slice(0, 15) || "INSTITUTION",
            path: "#" 
          },
          { label: `ORDER_DET_#${order!.id}`, active: true }
        ]}
        stats={[
          { 
            label: "STATUS", 
            value: order!.status?.toUpperCase() || "UNKNOWN", 
            color: order!.status === ChargeOrderStatus.PAID ? "text-emerald-400" : "text-yellow-500" 
          },
          { 
            label: "BALANCE", 
            value: `$${pending.toFixed(2)}`, 
            color: pending > 0 ? "text-red-400" : "text-emerald-400" 
          },
          { 
            label: "INSTITUTION",
            value: order!.institution?.name?.toUpperCase().slice(0, 12) || "NONE",
            color: "text-purple-400" 
          }
        ]}
        actions={
          <div className="flex gap-2">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 border border-white/10 text-[9px] font-mono hover:bg-white/5 uppercase transition-all bg-white/[0.02]">
              <ArrowLeftIcon className="w-3 h-3" /> [ Abort_View ]
            </button>
            
            {order!.institution && (
              <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border-purple-500/20">
                <BuildingOfficeIcon className="w-3 h-3 text-purple-400" />
                <span className="text-[8px] font-mono text-purple-300 uppercase tracking-[0.2em]">
                  {order!.institution.tax_id}
                </span>
              </div>
            )}
          </div>
        }
      />
      
      {/* BANNER INSTITUCIONAL */}
      {order!.institution && (
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BuildingOfficeIcon className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-[11px] font-black text-purple-300 uppercase tracking-[0.3em]">
                  {order!.institution.name}
                </h3>
                <p className="text-[8px] font-mono text-purple-400/70 uppercase tracking-[0.2em]">
                  TAX_ID: {order!.institution.tax_id} // ID: {order!.institution.id}
                </p>
              </div>
            </div>
            
            {activeInstitution && activeInstitution.id !== order!.institution.id && (
              <div className="bg-yellow-500/10 border-yellow-500/20 px-3 py-1 rounded-sm">
                <span className="text-[7px] font-mono text-yellow-400 uppercase tracking-[0.2em]">
                  Cross-Institution_Context_Active
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--palantir-border)] border border-[var(--palantir-border)] shadow-2xl">
        {[
          { label: "GROSS_TOTAL", val: total, color: "text-white" },
          { label: "SETTLED_AMOUNT", val: paid, color: "text-emerald-400" },
          { label: "OUTSTANDING_DEBT", val: pending, color: pending > 0 ? "text-red-400" : "text-emerald-400" }
        ].map((s, i) => (
          <div key={i} className="bg-[var(--palantir-bg)] p-6 group hover:bg-white/[0.01] transition-colors">
            <p className="text-[8px] font-black tracking-[0.3em] text-[var(--palantir-muted)] uppercase mb-2 flex justify-between">
              {s.label} <span className="opacity-0 group-hover:opacity-100 transition-opacity">●</span>
            </p>
            <p className={`text-2xl font-mono font-black ${s.color}`}>${Number(s.val).toFixed(2)}</p>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <HashtagIcon className="w-4 h-4 text-[var(--palantir-active)]" />
              <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-[var(--palantir-text)] opacity-70">Service_Itemization</h3>
            </div>
            <div className="border border-white/5 bg-white/[0.01] overflow-hidden rounded-sm backdrop-blur-sm">
              <table className="w-full text-left font-mono">
                <thead className="bg-white/5 text-[9px] text-[var(--palantir-muted)] uppercase tracking-widest">
                  <tr>
                    <th className="p-4 font-black">CODE</th>
                    <th className="p-4 font-black">DESCRIPTION</th>
                    <th className="p-4 text-right font-black">QTY</th>
                    <th className="p-4 text-right font-black">UNIT</th>
                    <th className="p-4 text-right font-black">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[11px]">
                  {order!.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4 text-[var(--palantir-active)] font-bold">{item.code}</td>
                      <td className="p-4 text-white opacity-60 group-hover:opacity-100 uppercase transition-opacity">{item.description}</td>
                      <td className="p-4 text-right text-[var(--palantir-muted)]">{item.qty}</td>
                      <td className="p-4 text-right text-[var(--palantir-muted)]">${Number(item.unit_price).toFixed(2)}</td>
                      <td className="p-4 text-right font-black text-white">${Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <ClockIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-[var(--palantir-text)] opacity-70">Payment_Registry_History</h3>
            </div>
            <PaymentList payments={order!.payments || []} />
          </section>
        </div>
        
        <div className="lg:col-span-4 space-y-8">
          <section className="p-6 bg-white/[0.02] border border-white/5 space-y-4 rounded-sm shadow-xl">
            <h3 className="text-[9px] font-black tracking-[0.2em] uppercase text-[var(--palantir-muted)]">Operations_Panel</h3>
            <div className="grid grid-cols-1 gap-2">
              
              {/* ✅ BOTÓN UNIFICADO DE REGISTRO DE PAGO */}
              <button onClick={() => setShowPaymentSelector(true)} className="flex items-center justify-between p-4 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all group">
                Register_New_Payment <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              </button>
              
              <button onClick={handleExport} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all">
                Export_Voucher_PDF <DocumentArrowDownIcon className="w-4 h-4" />
              </button>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button 
                  onClick={() => voidMutation.mutate()} 
                  disabled={voidMutation.isPending} 
                  className="flex flex-col items-center justify-center p-4 bg-red-500/5 border-red-500/10 text-red-400/60 text-[8px] font-bold uppercase tracking-widest hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-30"
                >
                  <NoSymbolIcon className="w-4 h-4 mb-1" /> Void_Order
                </button>
                <button 
                  onClick={() => waiveMutation.mutate()} 
                  disabled={waiveMutation.isPending} 
                  className="flex flex-col items-center justify-center p-4 bg-yellow-500/5 border-yellow-500/10 text-yellow-500/60 text-[8px] font-bold uppercase tracking-widest hover:bg-yellow-500/20 hover:text-yellow-500 transition-all disabled:opacity-30"
                >
                  <GiftIcon className="w-4 h-4 mb-1" /> Waive_Order
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
      
      {/* ✅ MODAL SELECTOR DE MÉTODOS DE PAGO */}
      {showPaymentSelector && (
        <PaymentMethodSelectorModal
          chargeOrderId={order!.id}
          expectedAmount={pending}
          onClose={() => setShowPaymentSelector(false)}
          onSuccess={handlePaymentMethodSelect}
        />
      )}
      
      {/* ✅ MODAL DE PAGO EN EFECTIVO */}
      {showCashModal && (
        <CashPaymentModal
          open={showCashModal}
          appointmentId={order!.appointment}
          chargeOrderId={order!.id}
          expectedAmount={pending}
          onClose={() => setShowCashModal(false)}
        />
      )}
      
      {/* ✅ MODAL DE RESPALDO PARA VERIFICACIÓN MANUAL */}
      {showManualModal && (
        <ManualPaymentModal
          open={showManualModal}
          chargeOrderId={order!.id}
          expectedAmount={pending}
          onVerificationSuccess={() => {
            setShowManualModal(false);
            invalidateChargeOrders(id);
            setToast({ 
              message: "✅ MANUAL_PAYMENT_VERIFIED: Payment registered successfully", 
              type: "success" 
            });
          }}
          onClose={() => setShowManualModal(false)}
        />
      )}
      
      {/* ✅ TOAST NOTIFICATIONS */}
      {toast && (
        <div className="fixed bottom-4 right-4 p-4 rounded-lg bg-white shadow-lg border border-gray-200">
          <div className={`text-sm font-medium ${
            toast.type === "success" ? "text-green-600" :
            toast.type === "error" ? "text-red-600" : "text-blue-600"
          }`}>
            {toast.message}
          </div>
          <button 
            onClick={() => setToast(null)}
            className="ml-4 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}