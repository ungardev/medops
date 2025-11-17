// src/components/Consultation/ChargeOrderPanel.tsx
import React, { useEffect, useState } from "react";
import { ChargeOrder, ChargeItem, Payment } from "../../types/payments";
import {
  useChargeOrder,
  useCreatePayment,
  PaymentPayload,
} from "../../hooks/consultations/useChargeOrder";
import axios from "axios";

// 🔹 Props en modo dual: o recibes appointmentId (fetch interno) o el objeto chargeOrder
export type ChargeOrderPanelProps =
  | { appointmentId: number; readOnly?: boolean }
  | { chargeOrder: ChargeOrder; readOnly?: boolean };

function isAppointmentMode(
  props: ChargeOrderPanelProps
): props is { appointmentId: number; readOnly?: boolean } {
  return (props as any).appointmentId !== undefined;
}

const ChargeOrderPanel: React.FC<ChargeOrderPanelProps> = (props) => {
  const readOnly = props.readOnly ?? false;

  // 🔹 Estado de orden: viene de props o se carga por appointmentId
  const [order, setOrder] = useState<ChargeOrder | null>(null);

  // Modo A: appointmentId → fetch interno y autocreación defensiva
  const { data, isLoading, refetch } = isAppointmentMode(props)
    ? useChargeOrder(props.appointmentId)
    : { data: null, isLoading: false, refetch: async () => {} };

  useEffect(() => {
    if (!isAppointmentMode(props)) {
      // Modo B: chargeOrder directo
      setOrder(props.chargeOrder ?? null);
      return;
    }
    setOrder(data ?? null);
  }, [props, data]);

  useEffect(() => {
    if (!isAppointmentMode(props)) return;
    const appointmentId = props.appointmentId;
    if (!readOnly && order === null && appointmentId) {
      axios
        .post(`/appointments/${appointmentId}/charge-order/`)
        .then(() => {
          void refetch(); // ✅ ejecuta refetch, ignora el valor
        })
        .catch((err) => {
          console.error("Error creando orden automáticamente:", err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, readOnly]);

  const createPayment = useCreatePayment(
    order?.id ?? undefined,
    isAppointmentMode(props) ? props.appointmentId : order?.appointment
  );

  const [amount, setAmount] = useState("");
  const [method, setMethod] =
    useState<"cash" | "card" | "transfer" | "other">("cash");
  const [reference, setReference] = useState("");
  const [bank, setBank] = useState("");
  const [otherDetail, setOtherDetail] = useState("");

  const [showItems, setShowItems] = useState(false);
  const [showPayments, setShowPayments] = useState(false);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    const codeEl = document.getElementById("charge-item-code") as HTMLInputElement | null;
    const descEl = document.getElementById("charge-item-desc") as HTMLInputElement | null;
    const qtyEl = document.getElementById("charge-item-qty") as HTMLInputElement | null;
    const priceEl = document.getElementById("charge-item-price") as HTMLInputElement | null;

    const code = codeEl?.value?.trim() ?? "";
    const description = descEl?.value?.trim() ?? "";
    const qty = Number(qtyEl?.value ?? 0);
    const unitPrice = Number(priceEl?.value ?? 0);

    if (!code) return;
    if (isNaN(qty) || qty <= 0) return;
    if (isNaN(unitPrice) || unitPrice < 0) return;

    try {
      await axios.post("/charge-items/", {
        order: order.id,
        code,
        description,
        qty,
        unit_price: unitPrice,
      });
      if (codeEl) codeEl.value = "";
      if (descEl) descEl.value = "";
      if (qtyEl) qtyEl.value = "";
      if (priceEl) priceEl.value = "";
      void refetch(); // ✅ refetch seguro
    } catch (err: any) {
      console.error("Error agregando ítem:", err);
      if (err.response?.data) {
        console.error(
          "Detalles del backend:",
          JSON.stringify(err.response.data, null, 2)
        );
      }
    }
  };

    const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !order) return;
    const payload: PaymentPayload = {
      charge_order: order.id,
      amount: parseFloat(amount),
      method,
      reference_number: reference || null,
      bank: method === "transfer" ? bank : null,
      detail: method === "other" ? otherDetail : null,
    };
    createPayment.mutate(payload, {
      onSuccess: () => {
        setAmount("");
        setMethod("cash");
        setReference("");
        setBank("");
        setOtherDetail("");
        if (isAppointmentMode(props)) {
          void refetch(); // ✅ refetch seguro
        }
      },
      onError: (err) => {
        console.error("Error registrando pago:", err);
      },
    });
  };

  if (isAppointmentMode(props) && isLoading) {
    return <p className="text-muted">Cargando orden...</p>;
  }
  if (!order) return null;

  return (
    <div className="chargeorder-panel card">
      <h3 className="text-lg font-bold mb-2">Orden de Cobro</h3>

      <div className="mb-3 text-sm bg-gray-50 p-2 rounded">
        <p><strong>Total:</strong> ${Number(order.total ?? 0).toFixed(2)}</p>
        <p><strong>Pagado:</strong> ${(Number(order.total ?? 0) - Number(order.balance_due ?? 0)).toFixed(2)}</p>
        <p><strong>Saldo pendiente:</strong> ${Number(order.balance_due ?? 0).toFixed(2)}</p>
        <p><strong>Estado:</strong> {order.status}</p>
      </div>

      <button onClick={() => setShowItems(!showItems)} className="btn-toggle mb-2">
        {showItems ? "▼ Ítems" : "▶ Ítems"}
      </button>
      {showItems && (
        <div className="mb-4">
          <ul className="mb-3">
            {order.items?.length === 0 && <li className="text-muted">Sin ítems</li>}
            {order.items?.map((it: ChargeItem) => (
              <li key={it.id} className="border-b py-1">
                {it.code} — {it.description} ({it.qty} × ${Number(it.unit_price).toFixed(2)})
                <span className="ml-2 text-sm text-muted">= ${Number(it.subtotal).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          {!readOnly && (
            <form onSubmit={handleAddItem} className="flex flex-col gap-2">
              <input id="charge-item-code" type="text" placeholder="Servicio / Procedimiento" className="input" required />
              <input id="charge-item-desc" type="text" placeholder="Detalle adicional (opcional)" className="input" />
              <input id="charge-item-qty" type="number" placeholder="Cantidad" className="input" required />
              <input id="charge-item-price" type="number" step="0.01" placeholder="Precio unitario" className="input" required />
              <button type="submit" className="btn-secondary self-start">+ Agregar ítem</button>
            </form>
          )}
        </div>
      )}

      <button onClick={() => setShowPayments(!showPayments)} className="btn-toggle mb-2">
        {showPayments ? "▼ Pagos" : "▶ Pagos"}
      </button>
      {showPayments && (
        <div>
          <ul className="mb-3">
            {order.payments?.length === 0 && <li className="text-muted">Sin pagos registrados</li>}
            {order.payments?.map((p: Payment) => (
              <li key={p.id} className="border-b py-1">
                <strong>${Number(p.amount ?? 0).toFixed(2)}</strong> — {p.method}
                <span className="text-sm text-muted">
                  {" "}{p.status} {p.reference_number && `| Ref: ${p.reference_number}`}
                </span>
              </li>
            ))}
          </ul>

          {!readOnly && (
            <form onSubmit={handleAddPayment} className="flex flex-col gap-2">
              <input type="number" step="0.01" placeholder="Monto" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" required />
              <select value={method} onChange={(e) => setMethod(e.target.value as "cash" | "card" | "transfer" | "other")} className="select">
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
                <option value="other">Otro</option>
              </select>

              {method === "card" && (
                <input type="text" placeholder="Referencia de tarjeta" value={reference} onChange={(e) => setReference(e.target.value)} className="input" required />
              )}
              {method === "transfer" && (
                <>
                  <input type="text" placeholder="Banco" value={bank} onChange={(e) => setBank(e.target.value)} className="input" required />
                  <input type="text" placeholder="Referencia de transferencia" value={reference} onChange={(e) => setReference(e.target.value)} className="input" required />
                </>
              )}
              {method === "other" && (
                <input type="text" placeholder="Detalle del pago" value={otherDetail} onChange={(e) => setOtherDetail(e.target.value)} className="input" required />
              )}

              <button type="submit" className="btn-primary self-start" disabled={createPayment.isPending}>
                {createPayment.isPending ? "Registrando..." : "+ Registrar pago"}
              </button>
              {createPayment.isError && (
                <p className="text-red-500 text-sm">Error al registrar el pago. Intente de nuevo.</p>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ChargeOrderPanel;
