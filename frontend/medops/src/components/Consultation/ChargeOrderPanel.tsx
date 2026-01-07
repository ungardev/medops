// src/components/Consultation/ChargeOrderPanel.tsx
import React, { useEffect, useState } from "react";
import { ChargeOrder, ChargeItem, Payment } from "../../types/payments";
import { useChargeOrder, useCreatePayment, PaymentPayload } from "../../hooks/consultations/useChargeOrder";
import axios from "axios";
import { 
  CurrencyDollarIcon, 
  ChevronDownIcon, 
  ChevronRightIcon, 
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckBadgeIcon,
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

const ChargeOrderPanel: React.FC<ChargeOrderPanelProps> = (props) => {
  const readOnly = props.readOnly ?? false;
  const [order, setOrder] = useState<ChargeOrder | null>(null);
  const [showItems, setShowItems] = useState(false);
  const [showPayments, setShowPayments] = useState(false);

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

  // Estados de Formulario de Pago
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "card" | "transfer" | "other">("cash");
  const [reference, setReference] = useState("");
  const [bank, setBank] = useState("");
  const [otherDetail, setOtherDetail] = useState("");

  // Estados de Edición de Ítems
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editQty, setEditQty] = useState(1);
  const [editPrice, setEditPrice] = useState(0);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      await axios.post("/charge-items/", {
        order: order.id,
        code: formData.get("code"),
        description: formData.get("desc"),
        qty: Number(formData.get("qty")),
        unit_price: Number(formData.get("price")),
      });
      form.reset();
      void refetch();
    } catch (err) { console.error("Item_Add_Fault:", err); }
  };

  const handleUpdateItem = async (id: number) => {
    try {
      await axios.put(`/charge-items/${id}/`, {
        code: order?.items?.find((i) => i.id === id)?.code,
        description: editDescription,
        qty: editQty,
        unit_price: editPrice,
      });
      setEditItemId(null);
      void refetch();
    } catch (err) { console.error("Update_Fault:", err); }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("Confirm Item Deletion?")) return;
    try {
      await axios.delete(`/charge-items/${id}/`);
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
        onClick={async () => {
          await axios.post(`/appointments/${props.appointmentId}/charge-order/`);
          void refetch();
        }}
        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[var(--palantir-active)] text-[var(--palantir-active)] hover:bg-[var(--palantir-active)]/10 transition-all text-[10px] font-black uppercase tracking-[0.2em]"
      >
        <PlusIcon className="w-4 h-4" /> Initialize_Billing_Order
      </button>
    ) : null;
  }

  const isPaid = Number(order.balance_due) <= 0;

  return (
    <div className="space-y-4">
      {/* 01. FINANCIAL SUMMARY CARD */}
      <div className={`relative overflow-hidden border p-3 ${isPaid ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
        <div className="flex justify-between items-start mb-2">
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Financial_Ledger</span>
          <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${isPaid ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
            {order.status}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-[var(--palantir-muted)] font-mono uppercase">Total_Due</p>
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

      {/* 02. ITEMS SECTION */}
      <div className="border border-[var(--palantir-border)] bg-black/20 overflow-hidden">
        <button 
          onClick={() => setShowItems(!showItems)}
          className="w-full flex items-center justify-between p-2 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ReceiptPercentIcon className="w-4 h-4 text-[var(--palantir-active)]" />
            <span className="text-[10px] font-black uppercase tracking-widest">Billing_Items</span>
          </div>
          {showItems ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
        </button>

        {showItems && (
          <div className="p-3 space-y-3 border-t border-[var(--palantir-border)]">
            {!readOnly && (
              <form onSubmit={handleAddItem} className="grid grid-cols-2 gap-2">
                <input name="code" placeholder="CODE" className="bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none focus:border-[var(--palantir-active)]" required />
                <input name="price" type="number" step="0.01" placeholder="PRICE" className="bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none focus:border-[var(--palantir-active)]" required />
                <input name="desc" placeholder="DESCRIPTION" className="col-span-2 bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none focus:border-[var(--palantir-active)]" required />
                <input name="qty" type="number" defaultValue="1" className="bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none focus:border-[var(--palantir-active)]" required />
                <button type="submit" className="bg-[var(--palantir-active)] text-white text-[9px] font-black uppercase tracking-widest">Add_Item</button>
              </form>
            )}
            <div className="space-y-1">
              {order.items?.map((it) => (
                <div key={it.id} className="group flex items-center justify-between p-2 bg-white/5 border border-transparent hover:border-[var(--palantir-border)] transition-all">
                  {editItemId === it.id ? (
                    <div className="w-full space-y-2">
                      <input value={editDescription} onChange={e => setEditDescription(e.target.value)} className="w-full bg-black p-1 text-[10px] font-mono border border-[var(--palantir-active)]" />
                      <div className="flex gap-1">
                        <button onClick={() => handleUpdateItem(it.id)} className="flex-1 bg-emerald-600 text-[8px] font-black py-1">SAVE</button>
                        <button onClick={() => setEditItemId(null)} className="flex-1 bg-white/10 text-[8px] font-black py-1">VOID</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold truncate uppercase">{it.description}</p>
                        <p className="text-[8px] font-mono text-[var(--palantir-muted)] italic">
                          {it.code} // {it.qty}u × ${Number(it.unit_price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black font-mono">${Number(it.subtotal).toFixed(2)}</span>
                        {!readOnly && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditItemId(it.id); setEditDescription(it.description ?? ""); setEditQty(it.qty ?? 1); setEditPrice(it.unit_price ?? 0); }}>
                              <PencilSquareIcon className="w-3 h-3 text-[var(--palantir-active)]" />
                            </button>
                            <button onClick={() => handleDeleteItem(it.id)}>
                              <TrashIcon className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 03. PAYMENTS SECTION */}
      <div className="border border-[var(--palantir-border)] bg-black/20 overflow-hidden">
        <button 
          onClick={() => setShowPayments(!showPayments)}
          className="w-full flex items-center justify-between p-2 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CheckBadgeIcon className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest">Transaction_Log</span>
          </div>
          {showPayments ? <ChevronDownIcon className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
        </button>

        {showPayments && (
          <div className="p-3 space-y-3 border-t border-[var(--palantir-border)]">
            {!readOnly && (
              <form onSubmit={handleAddPayment} className="space-y-2">
                <div className="grid grid-cols-2 gap-1">
                  <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="AMOUNT_USD" className="bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none" required />
                  <select value={method} onChange={e => setMethod(e.target.value as any)} className="bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none">
                    <option value="cash">CASH_LIQUID</option>
                    <option value="card">CARD_POS</option>
                    <option value="transfer">WIRE_TRANSFER</option>
                    <option value="other">OTHER_ASSET</option>
                  </select>
                </div>
                <input placeholder="REFERENCE_NUM" value={reference} onChange={e => setReference(e.target.value)} className="w-full bg-black/40 border border-[var(--palantir-border)] p-2 text-[10px] font-mono outline-none" />
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all">Execute_Payment</button>
              </form>
            )}
            <div className="space-y-1">
              {order.payments?.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-2 bg-emerald-500/5 border-l-2 border-emerald-500">
                  {p.method === 'cash' ? <BanknotesIcon className="w-4 h-4" /> : p.method === 'card' ? <CreditCardIcon className="w-4 h-4" /> : <ArrowsRightLeftIcon className="w-4 h-4" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-tighter">${Number(p.amount).toFixed(2)}</span>
                      <span className="text-[8px] font-mono opacity-50 uppercase">{p.method}</span>
                    </div>
                    {p.reference_number && <p className="text-[8px] font-mono truncate">REF: {p.reference_number}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChargeOrderPanel;
