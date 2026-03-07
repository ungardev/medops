import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageHeader from "@/components/Common/PageHeader";
import { usePatientChargeOrderDetail } from "@/hooks/patient/usePatientChargeOrders";
import { useRegisterPayment } from "@/hooks/patient/useRegisterPayment";
import { useBCVRate } from "@/hooks/dashboard/useBCVRate";
import { VENEZUELAN_BANKS, getBankName } from "@/constants/banks";
import { Loader2 } from "lucide-react";
import { 
  ArrowLeftIcon,
  PlusIcon,
  ClockIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
export default function PatientChargeOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orderId = Number(id);
  
  const { data: order, isLoading, error } = usePatientChargeOrderDetail(orderId);
  const { data: bcvRate } = useBCVRate();
  const registerPayment = useRegisterPayment();
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    bank_code: "",
    phone: "",
    national_id: "",
    reference: "",
    amount_bs: "",
  });
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const bcvValue = bcvRate ? Number(bcvRate.value) : 1;
  
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
        }
      });
      
      setSuccessMessage(result.payment.message);
      setShowModal(false);
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
  
  const total = order.total;
  const paid = order.payments.reduce((acc, p) => acc + p.amount, 0);
  const balance = order.balance_due;
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      {/* HEADER */}
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
            value: `Bs ${(balance * bcvValue).toLocaleString('es-VE', { minimumFractionDigits: 0 })}`, 
            color: balance > 0 ? "text-red-400" : "text-emerald-400"
          },
          { 
            label: "BCV", 
            value: bcvValue.toLocaleString('es-VE', { minimumFractionDigits: 2 }), 
            color: "text-purple-400"
          }
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
      {/* RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
        {[
          { label: "TOTAL", val: total * bcvValue, color: "text-white" },
          { label: "PAGADO", val: paid * bcvValue, color: "text-emerald-400" },
          { label: "PENDIENTE", val: balance * bcvValue, color: balance > 0 ? "text-red-400" : "text-emerald-400" }
        ].map((s, i) => (
          <div key={i} className="bg-[#111] p-6">
            <p className="text-[8px] font-black tracking-[0.3em] text-white/40 uppercase mb-2">{s.label}</p>
            <p className={`text-2xl font-mono font-bold ${s.color}`}>
              Bs {s.val.toLocaleString('es-VE', { minimumFractionDigits: 0 })}
            </p>
          </div>
        ))}
      </div>
      {/* INFO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* ITEMS */}
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
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="p-4 text-blue-400 font-bold">{item.code}</td>
                      <td className="p-4 text-white/60 uppercase">{item.description}</td>
                      <td className="p-4 text-right text-white/40">{item.qty}</td>
                      <td className="p-4 text-right text-white/40">Bs {(item.unit_price * bcvValue).toLocaleString('es-VE', { minimumFractionDigits: 0 })}</td>
                      <td className="p-4 text-right font-bold text-white">Bs {(item.subtotal * bcvValue).toLocaleString('es-VE', { minimumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          
          {/* HISTORIAL DE PAGOS */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
              <h3 className="text-[10px] font-black tracking-[0.2em] uppercase text-white/70">Historial de Pagos</h3>
            </div>
            {order.payments.length === 0 ? (
              <div className="p-6 text-center text-white/30 text-[10px] font-mono">
                No hay pagos registrados
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-white text-[10px] font-bold">Pago #{payment.id}</p>
                      <p className="text-white/40 text-[9px] font-mono">{payment.received_at || "—"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-400 font-bold">Bs {(payment.amount * bcvValue).toLocaleString('es-VE', { minimumFractionDigits: 0 })}</p>
                      <p className="text-white/40 text-[8px] uppercase">{payment.method} - {payment.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        
        {/* PANEL DE OPERACIONES */}
        <div className="lg:col-span-4 space-y-8">
          {order.status !== 'paid' && order.status !== 'void' && order.status !== 'waived' && (
            <section className="p-6 bg-white/[0.02] border border-white/5 space-y-4 rounded-sm">
              <h3 className="text-[9px] font-black tracking-[0.2em] uppercase text-white/40">Operaciones</h3>
              <button 
                onClick={() => setShowModal(true)}
                className="w-full flex items-center justify-between p-4 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
              >
                Registrar Mi Pago <PlusIcon className="w-4 h-4" />
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
      {/* MODAL REGISTRAR PAGO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] border border-white/10 rounded-sm w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="text-[12px] font-black uppercase tracking-wider">Registrar Pago - Orden #{order.id}</h3>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white">
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
                <label className="block text-[10px] font-bold text-white/40 uppercase mb-2">Banco</label>
                <select
                  value={formData.bank_code}
                  onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-sm text-white focus:outline-none focus:border-emerald-500/50"
                  required
                >
                  <option value="">Seleccionar banco</option>
                  {VENEZUELAN_BANKS.map(bank => (
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
                  onClick={() => setShowModal(false)}
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
