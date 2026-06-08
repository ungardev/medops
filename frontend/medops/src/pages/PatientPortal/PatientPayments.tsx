import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/Common/PageHeader";
import { usePatientChargeOrders } from "@/hooks/patient/usePatientChargeOrders";
import { Loader2 } from "lucide-react";
import { BanknotesIcon, CircleStackIcon, ShieldCheckIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  open: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  partially_paid: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400" },
  paid: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  void: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
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
  
  const orders = data?.orders ?? [];
  const summary = data?.summary;
  
  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-emerald-400/60 animate-spin" />
        <p className="text-xs text-emerald-400/60">Cargando pagos...</p>
      </div>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "Mis Pagos", active: true }
        ]}
        stats={[
          { 
            label: "Pendiente", 
            value: summary?.total_pending 
              ? `$ ${Number(summary.total_pending).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
              : "$ 0.00",
            color: "text-amber-400"
          },
          { 
            label: "Pagado", 
            value: summary?.total_paid 
              ? `$ ${Number(summary.total_paid).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`
              : "$ 0.00",
            color: "text-emerald-400"
          },
          { 
            label: "Moneda", 
            value: "USD",
            color: "text-white/50"
          }
        ]}
        actions={
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/20 rounded-lg">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400">
              Conexión segura
            </span>
          </div>
        }
      />
      
      <section className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 border border-white/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CircleStackIcon className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-white/40">Pendiente</span>
            </div>
            <div className="text-2xl font-semibold text-amber-400">
              $ {summary?.total_pending 
                ? Number(summary.total_pending).toLocaleString('es-VE', { minimumFractionDigits: 2 })
                : "0.00"}
            </div>
            <p className="text-xs text-white/50 mt-1">
              {summary?.pending_orders || 0} órdenes activas
            </p>
          </div>
          
          <div className="bg-white/10 border border-white/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <BanknotesIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-white/40">Pagado</span>
            </div>
            <div className="text-2xl font-semibold text-emerald-400">
              $ {summary?.total_paid 
                ? Number(summary.total_paid).toLocaleString('es-VE', { minimumFractionDigits: 2 })
                : "0.00"}
            </div>
            <p className="text-xs text-white/50 mt-1">
              {summary?.paid_orders || 0} órdenes completadas
            </p>
          </div>
          
          <div className="bg-white/10 border border-white/20 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-white/40">Total Órdenes</span>
            </div>
            <div className="text-2xl font-semibold text-white/80">
              {summary?.total_orders || 0}
            </div>
            <p className="text-xs text-white/50 mt-1">
              transacciones en el sistema
            </p>
          </div>
        </div>
      </section>
      
      <section className="space-y-4">
        <div className="border border-white/20 bg-white/10 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/20 bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CircleStackIcon className="w-4 h-4 text-white/30" />
              <h3 className="text-sm font-medium text-white/60">
                Historial de Órdenes
              </h3>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/20">
              <span>Total: <span className="text-white/50">{orders.length}</span></span>
            </div>
          </div>
          
          <div className="divide-y divide-white/5">
            {orders.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center p-12">
                <BanknotesIcon className="w-8 h-8 text-white/10 mb-4" />
                <p className="text-sm text-white/20">
                  No se encontraron órdenes
                </p>
              </div>
            )}
            
            {orders.map((order, index) => {
              const statusConfig = STATUS_COLORS[order.status] || STATUS_COLORS.open;
              return (
                <div 
                  key={order.id}
                  className={`group flex items-center justify-between p-5 hover:bg-white/10 transition-all cursor-pointer ${
                    order.status === 'paid' ? 'bg-emerald-500/5' : 
                    order.status === 'void' ? 'bg-red-500/5' : ''
                  } ${order.is_dependent_order ? 'border-l-2 border-l-white/20' : ''}`}
                  onClick={() => navigate(`/patient/payments/${order.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-mono text-white/30 mb-1">
                        {String(index + 1).padStart(3, '0')}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white/80">
                            Orden #{order.id} - {order.institution}
                          </p>
                          {order.patient_is_minor && (
                            <span className="text-xs px-2 py-0.5 bg-white/5 border border-white/10 text-white/40 rounded">
                              Menor
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/20">
                          {order.issued_at}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 border ${statusConfig.bg} border-current/20`}>
                            <div className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
                            <span className={`text-xs font-medium ${statusConfig.text}`}>
                              {order.status_display}
                            </span>
                          </div>
                          {order.is_dependent_order && order.responsible_payer_name && (
                            <span className="text-xs text-white/30">
                              Pagado por: {order.responsible_payer_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-base font-medium text-white/80">
                        $ {Number(order.balance_due).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </span>
                      <p className="text-xs text-white/20">
                        Total: $ {Number(order.total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
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