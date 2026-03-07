import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/Common/PageHeader";
import { usePatientChargeOrders } from "@/hooks/patient/usePatientChargeOrders";
import { useBCVRate } from "@/hooks/dashboard/useBCVRate";
import { Loader2 } from "lucide-react";
import { 
  BanknotesIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  ChevronRightIcon
} from "@heroicons/react/24/outline";
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  open: { bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500" },
  partially_paid: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  paid: { bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500" },
  void: { bg: "bg-red-500/10", text: "text-red-500", dot: "bg-red-500" },
  waived: { bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-400" },
};
export default function PatientPayments() {
  const navigate = useNavigate();
  const storedPatientId = localStorage.getItem("patient_id");
  
  useEffect(() => {
    if (!storedPatientId) {
      navigate("/patient/login");
    }
  }, [navigate, storedPatientId]);
  
  if (!storedPatientId) return null;
  
  const { data, isLoading, error } = usePatientChargeOrders();
  const { data: bcvRate } = useBCVRate();
  
  const orders = data?.orders ?? [];
  const summary = data?.summary;
  
  const bcvDisplay = bcvRate 
    ? `${Number(bcvRate.value).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs/USD`
    : "--";
  
  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-blue-500">Syncing_Payments...</p>
      </div>
    </div>
  );
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      {/* HEADER */}
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "MIS PAGOS", active: true }
        ]}
        stats={[
          { 
            label: "TOTAL_PENDING", 
            value: summary?.total_pending 
              ? `Bs ${Number(summary.total_pending * (bcvRate ? Number(bcvRate.value) : 1)).toLocaleString('es-VE', { minimumFractionDigits: 0 })}`
              : "Bs 0",
            color: "text-amber-500"
          },
          { 
            label: "TOTAL_PAID", 
            value: summary?.total_paid 
              ? `Bs ${Number(summary.total_paid * (bcvRate ? Number(bcvRate.value) : 1)).toLocaleString('es-VE', { minimumFractionDigits: 0 })}`
              : "Bs 0",
            color: "text-emerald-500"
          },
          { 
            label: "BCV_RATE", 
            value: bcvDisplay,
            color: "text-purple-400"
          }
        ]}
        actions={
          <div className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-white/10 rounded-sm shadow-xl">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500/60" />
            <span className="text-[7px] font-mono text-emerald-500/40 uppercase tracking-[0.3em]">
              End-to-End_Encrypted
            </span>
          </div>
        }
      />
      {/* MÉTRICAS */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111] border border-white/10 rounded-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <CircleStackIcon className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40">PENDIENTE</span>
            </div>
            <div className="text-2xl font-bold text-amber-500">
              Bs {summary?.total_pending 
                ? (summary.total_pending * (bcvRate ? Number(bcvRate.value) : 1)).toLocaleString('es-VE', { minimumFractionDigits: 0 })
                : "0"}
            </div>
            <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
              {summary?.pending_orders || 0} órdenes activas
            </p>
          </div>
          
          <div className="bg-[#111] border border-white/10 rounded-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <BanknotesIcon className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40">PAGADO</span>
            </div>
            <div className="text-2xl font-bold text-emerald-500">
              Bs {summary?.total_paid 
                ? (summary.total_paid * (bcvRate ? Number(bcvRate.value) : 1)).toLocaleString('es-VE', { minimumFractionDigits: 0 })
                : "0"}
            </div>
            <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
              {summary?.paid_orders || 0} órdenes completadas
            </p>
          </div>
          
          <div className="bg-[#111] border border-white/10 rounded-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40">TOTAL ÓRDENES</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {summary?.total_orders || 0}
            </div>
            <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
              transacciones en el sistema
            </p>
          </div>
        </div>
      </section>
      {/* LISTA DE ÓRDENES */}
      <section className="space-y-4">
        <div className="border border-white/10 bg-[#111] rounded-sm overflow-hidden shadow-2xl">
          <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CircleStackIcon className="w-4 h-4 text-white/40" />
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90">
                HISTORIAL_DE_ÓRDENES
              </h3>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-mono text-white/30">
              <span>TOTAL: <span className="text-white">{orders.length}</span></span>
              <span>STATUS: <span className="text-white">{isLoading ? 'LOADING' : 'READY'}</span></span>
            </div>
          </div>
          
          <div className="divide-y divide-white/5">
            {orders.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center p-12 text-white/20">
                <BanknotesIcon className="w-8 h-8 text-white/40 mb-4" />
                <p className="text-[12px] font-mono uppercase tracking-widest italic">
                  NO_ÓRDENES_ENCONTRADAS
                </p>
              </div>
            )}
            
            {orders.map((order, index) => {
              const statusConfig = STATUS_COLORS[order.status] || STATUS_COLORS.open;
              return (
                <div 
                  key={order.id}
                  className={`group flex items-center justify-between p-4 hover:bg-white/5 transition-all cursor-pointer ${
                    order.status === 'paid' ? 'bg-emerald-500/5' : 
                    order.status === 'void' ? 'bg-red-500/5' : ''
                  }`}
                  onClick={() => navigate(`/patient/payments/${order.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <span className="text-[11px] font-mono text-white/60 mb-1">
                        {String(index + 1).padStart(3, '0').toUpperCase()}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[10px] font-bold text-white">
                          Order #{order.id} - {order.institution}
                        </p>
                        <p className="text-[9px] font-mono text-white/30">
                          {order.issued_at}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 border ${statusConfig.bg} border-current/20`}>
                            <div className={`h-1 w-1 rounded-full ${statusConfig.dot}`} />
                            <span className={`text-[8px] font-black uppercase tracking-tight ${statusConfig.text}`}>
                              {order.status_display}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[14px] font-bold text-white">
                        Bs {Number(order.balance_due * (bcvRate ? Number(bcvRate.value) : 1)).toLocaleString('es-VE', { minimumFractionDigits: 0 })}
                      </span>
                      <p className="text-[9px] font-mono text-white/40 uppercase">
                        Total: Bs {Number(order.total * (bcvRate ? Number(bcvRate.value) : 1)).toLocaleString('es-VE', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
