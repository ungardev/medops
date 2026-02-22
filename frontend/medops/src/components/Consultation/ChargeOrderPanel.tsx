// src/components/Consultation/ChargeOrderPanel.tsx
import React, { useEffect, useState } from "react";
import { ChargeOrder, ChargeItem, Payment } from "../../types/payments";
import { useChargeOrder, useCreatePayment, PaymentPayload } from "../../hooks/consultations/useChargeOrder";
import { apiFetch } from "../../api/client";
import type { BillingItem } from "../../types/billing";
import ServiceSearchCombobox from "./ServiceSearchCombobox";
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  MinusIcon,
  BanknotesIcon,
  CreditCardIcon,
  ArrowsRightLeftIcon,
  ReceiptPercentIcon
} from "@heroicons/react/24/outline";
export type ChargeOrderPanelProps =
  | { appointmentId: number; readOnly?: boolean }
  | { chargeOrder: ChargeOrder; readOnly?: boolean };
function isAppointmentMode(props: ChargeOrderPanelProps): props is { appointmentId: number; readOnly?: boolean } {
  return (props as any).appointmentId !== undefined;
}
interface PendingItem {
  billingItem: BillingItem;
  quantity: number;
}
const ChargeOrderPanel: React.FC<ChargeOrderPanelProps> = (props) => {
  const readOnly = props.readOnly ?? false;
  const [order, setOrder] = useState<ChargeOrder | null>(null);
  const [showItems, setShowItems] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [isSavingItems, setIsSavingItems] = useState(false);
  const { data, isLoading, refetch } = isAppointmentMode(props)
    ? useChargeOrder(props.appointmentId)
    : { data: null, isLoading: false, refetch: async () => {} };
  useEffect(() => {
    if (!isAppointmentMode(props)) {
      setOrder(props.chargeOrder ?? null);
      return;
    }
    setOrder(data ?? null);
  }, [props, data]);
  const createPayment = useCreatePayment(
    order?.id ?? undefined,
    isAppointmentMode(props) ? props.appointmentId : order?.appointment
  );
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "card" | "transfer" | "zelle" | "crypto" | "other">("cash");
  const [reference, setReference] = useState("");
  const [bank, setBank] = useState("");
  const [otherDetail, setOtherDetail] = useState("");
  const handleCreateOrder = async () => {
    if (!isAppointmentMode(props)) return;
    try {
      await apiFetch(`appointments/${props.appointmentId}/charge-order/create/`, {
        method: "POST",
      });
      void refetch();
    } catch (err) {
      console.error("Order_Create_Fault:", err);
    }
  };
  const handleSelectService = (item: BillingItem) => {
    const existing = pendingItems.find(p => p.billingItem.id === item.id);
    if (existing) {
      setPendingItems(pendingItems.map(p => 
        p.billingItem.id === item.id 
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ));
    } else {
      setPendingItems([...pendingItems, { billingItem: item, quantity: 1 }]);
    }
  };
  const updatePendingQuantity = (itemId: number, delta: number) => {
    setPendingItems(pendingItems.map(p => {
      if (p.billingItem.id === itemId) {
        const newQty = Math.max(1, p.quantity + delta);
        return { ...p, quantity: newQty };
      }
      return p;
    }));
  };
  const removePendingItem = (itemId: number) => {
    setPendingItems(pendingItems.filter(p => p.billingItem.id !== itemId));
  };
  const pendingSubtotal = pendingItems.reduce(
    (sum, p) => sum + (Number(p.billingItem.unit_price) * p.quantity),
    0
  );
  const handleSavePendingItems = async () => {
    if (!order || pendingItems.length === 0) return;
    setIsSavingItems(true);
    try {
      await Promise.all(
        pendingItems.map(p => 
          apiFetch("charge-items/", {
            method: "POST",
            body: JSON.stringify({
              order: order.id,
              code: p.billingItem.code,
              description: p.billingItem.name,
              qty: p.quantity,
              unit_price: p.billingItem.unit_price,
            }),
          })
        )
      );
      setPendingItems([]);
      void refetch();
    } catch (err) {
      console.error("Save_Items_Fault:", err);
    } finally {
      setIsSavingItems(false);
    }
  };
  const handleDeleteItem = async (id: number) => {
    if (!confirm("Confirmar eliminación del ítem?")) return;
    try {
      await apiFetch(`charge-items/${id}/`, { method: "DELETE" });
      void refetch();
    } catch (err) { console.error("Delete_Fault:", err); }
  };
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !order) return;
    createPayment.mutate({
      charge_order: order.id,
      amount: parseFloat(amount),
      method,
      reference_number: reference || null,
      bank_name: method === "transfer" ? bank : null,
      detail: method === "other" ? otherDetail : null,
    }, {
      onSuccess: () => {
        setAmount(""); setReference(""); setBank(""); setOtherDetail("");
        void refetch();
      }
    });
  };
  if (isAppointmentMode(props) && isLoading) return <div className="animate-pulse h-20 bg-white/5 border border-[var(--palantir-border)]" />;
  
  if (!order) {
    return !readOnly && isAppointmentMode(props) ? (
      <button
        onClick={handleCreateOrder}
        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[var(--palantir-active)] text-[var(--palantir-active)] hover:bg-[var(--palantir-active)]/10 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
      >
        <PlusIcon className="w-4 h-4" /> Inicializar_Orden_Cobro
      </button>
    ) : null;
  }
  const isPaid = Number(order.balance_due) <= 0;
  return (
    <div className="space-y-4">
      {/* 01. RESUMEN FINANCIERO */}
      <div className={`relative overflow-hidden border p-3 ${isPaid ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
        <div className="flex justify-between items-start mb-2">
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Libro_Financiero</span>
          <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${isPaid ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
            {order.status}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-[var(--palantir-muted)] font-mono uppercase">Total_Debido</p>
            <p className="text-lg font-black tracking-tighter">${Number(order.total).toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[var(--palantir-muted)] font-mono uppercase italic">Balance_Rem</p>
            <p className={`text-lg font-black tracking-tighter ${isPaid ? 'text-emerald-500' : 'text-red-500'}`}>
              ${Number(order.balance_due).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      {/* 02. SECCIÓN DE ÍTEMS */}
      <div className="border border-[var(--palantir-border)] bg-black/20 overflow-hidden">
        <button 
          onClick={() => setShowItems(!showItems)}
          className="w-full flex items-center justify-between p-2 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ReceiptPercentIcon className="w-4 h-4 text-[var(--palantir-active)]" />
            <span className="text-[10px] font-black uppercase tracking-widest">Items_Facturacion</span>
          </div>
          {showItems ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
        </button>
        
        {showItems && (
          <div className="p-3 space-y-3 border-t border-[var(--palantir-border)]">
            {!readOnly && (
              <>
                {/* BUSCADOR DE CATÁLOGO */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[var(--palantir-muted)]">
                    Agregar_Servicio_Catalogo
                  </label>
                  <ServiceSearchCombobox onSelect={handleSelectService} />
                </div>
                {/* ÍTEMS PENDIENTES */}
                {pendingItems.length > 0 && (
                  <div className="space-y-2 border border-[var(--palantir-active)]/30 bg-[var(--palantir-active)]/5 p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--palantir-active)]">
                        Items_Pendientes
                      </span>
                      <span className="text-[10px] font-mono font-black">
                        Subtotal: ${pendingSubtotal.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      {pendingItems.map((p) => (
                        <div key={p.billingItem.id} className="flex items-center justify-between p-2 bg-black/30 border border-white/5 group">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold truncate uppercase">{p.billingItem.name}</p>
                            <p className="text-[8px] font-mono text-[var(--palantir-muted)]">
                              [{p.billingItem.code}] ${Number(p.billingItem.unit_price).toFixed(2)} c/u
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* CONTROLES DE CANTIDAD */}
                            <div className="flex items-center gap-1 bg-black/40 border border-[var(--palantir-border)]">
                              <button
                                type="button"
                                onClick={() => updatePendingQuantity(p.billingItem.id, -1)}
                                className="p-1 hover:bg-white/10"
                              >
                                <MinusIcon className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-[10px] font-mono font-black min-w-[24px] text-center">
                                {p.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updatePendingQuantity(p.billingItem.id, 1)}
                                className="p-1 hover:bg-white/10"
                              >
                                <PlusIcon className="w-3 h-3" />
                              </button>
                            </div>
                            
                            {/* SUBTOTAL */}
                            <span className="text-[10px] font-black font-mono w-16 text-right">
                              ${(Number(p.billingItem.unit_price) * p.quantity).toFixed(2)}
                            </span>
                            
                            {/* ELIMINAR */}
                            <button
                              type="button"
                              onClick={() => removePendingItem(p.billingItem.id)}
                              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                            >
                              <XMarkIcon className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* BOTÓN GUARDAR - FIX: text-black para legibilidad */}
                    <button
                      type="button"
                      onClick={handleSavePendingItems}
                      disabled={isSavingItems}
                      className="w-full bg-[var(--palantir-active)] hover:bg-[var(--palantir-active)]/80 text-black py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50"
                    >
                      {isSavingItems ? "Guardando..." : "Agregar_a_Orden"}
                    </button>
                  </div>
                )}
              </>
            )}
            {/* ÍTEMS GUARDADOS EN LA ORDEN */}
            <div className="space-y-1">
              {order.items?.map((it) => (
                <div key={it.id} className="group flex items-center justify-between p-2 bg-white/5 border border-transparent hover:border-[var(--palantir-border)] transition-all">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold truncate uppercase">{it.description}</p>
                    <p className="text-[8px] font-mono text-[var(--palantir-muted)] italic">
                      {it.code} // {it.qty}u × ${Number(it.unit_price).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black font-mono">${Number(it.subtotal).toFixed(2)}</span>
                    {!readOnly && (
                      <button 
                        onClick={() => handleDeleteItem(it.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20"
                      >
                        <TrashIcon className="w-3 h-3 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {(!order.items || order.items.length === 0) && (
                <div className="text-center py-4 text-[10px] font-mono text-[var(--palantir-muted)]">
                  Sin items en la orden
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* 03. FORMULARIO DE PAGO RÁPIDO (Solo si hay deuda) */}
      {!readOnly && !isPaid && (
        <div className="border border-[var(--palantir-border)] bg-black/20 overflow-hidden">
          <button 
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="w-full flex items-center justify-between p-2 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BanknotesIcon className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">Registrar_Pago</span>
            </div>
            {showPaymentForm ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
          </button>
          
          {showPaymentForm && (
            <div className="p-3 space-y-2 border-t border-[var(--palantir-border)]">
              <form onSubmit={handleAddPayment} className="space-y-2">
                <div className="grid grid-cols-2 gap-1">
                  <input 
                    type="number" 
                    step="0.01" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)} 
                    placeholder="MONTO_USD" 
                    className="bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none focus:border-[var(--palantir-active)]" 
                    required 
                  />
                  <select 
                    value={method} 
                    onChange={e => setMethod(e.target.value as any)} 
                    className="bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none focus:border-[var(--palantir-active)]"
                  >
                    <option value="cash">EFECTIVO</option>
                    <option value="card">TARJETA_POS</option>
                    <option value="transfer">TRANSFERENCIA</option>
                    <option value="zelle">ZELLE_USD</option>
                    <option value="crypto">CRYPTO</option>
                    <option value="other">OTRO</option>
                  </select>
                </div>
                <input 
                  placeholder="NUMERO_REFERENCIA" 
                  value={reference} 
                  onChange={e => setReference(e.target.value)} 
                  className="w-full bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none focus:border-[var(--palantir-active)]" 
                />
                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all"
                >
                  Ejecutar_Pago
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ChargeOrderPanel;