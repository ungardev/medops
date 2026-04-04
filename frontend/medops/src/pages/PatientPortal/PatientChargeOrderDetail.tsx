// src/pages/PatientPortal/PatientChargeOrderDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/Common/PageHeader";
import { usePatientChargeOrderDetail } from "@/hooks/patient/usePatientChargeOrders";
import { Loader2 } from "lucide-react";
import RegisterPaymentModal from "@/components/PatientPortal/RegisterPaymentModal";
import { 
  ArrowLeftIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
export default function PatientChargeOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orderId = Number(id);
  
  const { data: order, isLoading, error, refetch } = usePatientChargeOrderDetail(orderId);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  const hasPendingPayments = order?.payments?.some((p: any) => p.status === 'pending') ?? false;
  const doctorData = order?.doctor as any;
  
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  if (isLoading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
    </div>
  );
  
  if (error || !order) return (
    <div className="p-8 text-center">
      <p className="text-red-400">Orden no encontrada</p>
      <button onClick={() => navigate("/patient/payments")} className="text-white/50 hover:text-white underline mt-2 inline-block">
        Volver a pagos
      </button>
    </div>
  );
  
  const total = order.total_ves || order.total * order.bcv_rate;
  const paid = order.payments.reduce((acc: number, p: any) => acc + (p.amount_ves || p.amount * (p.exchange_rate_bcv || order.bcv_rate)), 0);
  const balance = order.balance_due_ves || order.balance_due * order.bcv_rate;
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader 
        breadcrumbs={[
          { label: "MEDOPZ", path: "/patient" },
          { label: "Mis Pagos", path: "/patient/payments" },
          { label: `Orden #${order.id}`, active: true }
        ]}
        stats={[
          { 
            label: "Estado", 
            value: order.status_display || order.status, 
            color: order.status === 'paid' ? "text-emerald-400" : "text-amber-400"
          },
          { 
            label: "Pendiente", 
            value: `Bs ${balance.toLocaleString('es-VE', { minimumFractionDigits: 0 })}`, 
            color: balance > 0 ? "text-red-400" : "text-emerald-400"
          },
          { 
            label: "Tasa BCV", 
            value: order.bcv_rate.toLocaleString('es-VE', { minimumFractionDigits: 2 }), 
            color: "text-white/60"
          },
          ...(hasPendingPayments ? [{
            label: "Verificación",
            value: "En curso",
            color: "text-amber-400"
          }] : [])
        ]}
        actions={
          <button 
            onClick={() => navigate("/patient/payments")} 
            className="flex items-center gap-2 px-4 py-2 border border-white/15 bg-white/5 text-[11px] font-medium hover:bg-white/10 transition-all rounded-lg"
          >
            <ArrowLeftIcon className="w-4 h-4" /> Volver
          </button>
        }
      />
      
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-400 text-[11px] font-medium">{successMessage}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total", val: total, color: "text-white" },
          { label: "Pagado", val: paid, color: "text-emerald-400" },
          { label: "Pendiente", val: balance, color: balance > 0 ? "text-red-400" : "text-emerald-400" }
        ].map((s: any, i: number) => (
          <div key={i} className="bg-white/5 border border-white/15 rounded-lg p-5">
            <p className="text-[9px] font-medium tracking-wider text-white/40 uppercase mb-2">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>
              Bs {s.val.toLocaleString('es-VE', { minimumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-white/30" />
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
                  {order.items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-white/5">
                      <td className="p-4 text-blue-400 font-medium">{item.code}</td>
                      <td className="p-4 text-white/60">{item.description}</td>
                      <td className="p-4 text-right text-white/40">{item.qty}</td>
                      <td className="p-4 text-right text-white/40">Bs {(item.unit_price_ves || item.unit_price * order.bcv_rate).toLocaleString('es-VE', { minimumFractionDigits: 0 })}</td>
                      <td className="p-4 text-right font-medium text-white/80">Bs {(item.subtotal_ves || item.subtotal * order.bcv_rate).toLocaleString('es-VE', { minimumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-white/60">
                Historial de Pagos
                {hasPendingPayments && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                    <span className="text-amber-400 text-[9px]">Actualizando...</span>
                  </span>
                )}
              </h3>
            </div>
            {order.payments.length === 0 ? (
              <div className="p-6 text-center text-white/30 text-[11px]">
                No hay pagos registrados
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {order.payments.map((payment: any) => {
                  const amountBs = payment.amount_ves || (payment.amount * (payment.exchange_rate_bcv || order.bcv_rate));
                  
                  return (
                    <div key={payment.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="text-white/80 text-[11px] font-medium">Pago #{payment.id}</p>
                        <p className="text-white/30 text-[10px]">
                          {payment.received_at || "—"}
                          {payment.exchange_rate_bcv && (
                            <span className="text-white/40 ml-2">
                              (BCV: {payment.exchange_rate_bcv.toLocaleString('es-VE')})
                            </span>
                          )}
                        </p>
                        {payment.status === 'rejected' && payment.verification_notes && (
                          <p className="text-red-400 text-[9px] mt-1">
                            Rechazado: {payment.verification_notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-medium">Bs {amountBs.toLocaleString('es-VE', { minimumFractionDigits: 0 })}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <p className="text-white/30 text-[9px]">
                            {payment.method_display || payment.method} - {payment.status_display || payment.status}
                          </p>
                          {payment.verification_type && (
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-md ${
                              payment.verification_type === 'automatic' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {payment.verification_type === 'automatic' ? 'Auto' : 'Revisión'}
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
          {doctorData && order.status !== 'paid' && (
            <section className="p-5 bg-emerald-500/5 border border-emerald-500/20 space-y-4 rounded-lg">
              <h3 className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/70">Datos para Pagar</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/40 text-[10px]">Nombre</span>
                  <span className="text-white/80 text-[11px] font-medium">{doctorData.name}</span>
                </div>
                {doctorData.bank_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-[10px]">Banco</span>
                    <span className="text-white/80 text-[11px] font-medium">{doctorData.bank_name}</span>
                  </div>
                )}
                {doctorData.bank_rif && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-[10px]">Cédula/RIF</span>
                    <span className="text-white/80 text-[11px] font-medium font-mono">{doctorData.bank_rif}</span>
                  </div>
                )}
                {doctorData.bank_phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/40 text-[10px]">Teléfono</span>
                    <span className="text-white/80 text-[11px] font-medium font-mono">{doctorData.bank_phone}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-emerald-500/20">
                  <span className="text-white/40 text-[10px]">Monto a pagar</span>
                  <span className="text-emerald-400 text-[16px] font-semibold">Bs {balance.toLocaleString('es-VE', { minimumFractionDigits: 0 })}</span>
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
                className="w-full py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium uppercase tracking-wider rounded-lg hover:bg-emerald-500/15 transition-all"
              >
                Copiar Datos para Pagar
              </button>
            </section>
          )}
          
          {order.status !== 'paid' && order.status !== 'void' && order.status !== 'waived' && (
            <section className="p-5 bg-white/5 border border-white/15 space-y-4 rounded-lg">
              <h3 className="text-[10px] font-medium uppercase tracking-wider text-white/40">Operaciones</h3>
              <button 
                onClick={() => setShowRegisterModal(true)}
                className="w-full flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/15 transition-all rounded-lg"
              >
                Registrar Mi Pago <PlusIcon className="w-4 h-4" />
              </button>
            </section>
          )}
          
          {order.status === 'paid' && (
            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
              <CheckCircleIcon className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-emerald-400 font-medium uppercase text-[11px]">Orden Pagada</p>
            </div>
          )}
        </div>
      </div>
      
      {showRegisterModal && (
        <RegisterPaymentModal
          orderId={orderId}
          order={{
            id: order.id,
            min_amount_bs: order.min_amount_bs,
            bcv_rate: order.bcv_rate,
            balance_due_ves: order.balance_due_ves || order.balance_due * order.bcv_rate,
          }}
          doctorData={{
            name: doctorData?.name || "Doctor",
            bank_name: doctorData?.bank_name,
            bank_rif: doctorData?.bank_rif,
            bank_phone: doctorData?.bank_phone,
          }}
          balance={balance}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            refetch();
            setSuccessMessage("Pago registrado exitosamente. En breve será verificado.");
          }}
        />
      )}
    </div>
  );
}