// src/components/Consultation/ChargeOrderPanel.tsx
import React, { useEffect, useState } from "react";
import { ChargeOrder, ChargeItem, Payment } from "../../types/payments";
import {
  useChargeOrder,
  useCreatePayment,
  PaymentPayload,
} from "../../hooks/consultations/useChargeOrder";
import axios from "axios";

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
  const [order, setOrder] = useState<ChargeOrder | null>(null);

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

  useEffect(() => {
    if (!isAppointmentMode(props)) return;
    const appointmentId = props.appointmentId;
    if (!readOnly && order === null && appointmentId) {
      axios
        .post(`/appointments/${appointmentId}/charge-order/`)
        .then(() => {
          void refetch();
        })
        .catch((err) => {
          console.error("Error creando orden automáticamente:", err);
        });
    }
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

    if (!code || isNaN(qty) || qty <= 0 || isNaN(unitPrice) || unitPrice < 0) return;

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
      void refetch();
    } catch (err: any) {
      console.error("Error agregando ítem:", err);
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
          void refetch();
        }
      },
      onError: (err) => {
        console.error("Error registrando pago:", err);
      },
    });
  };

  if (isAppointmentMode(props) && isLoading) {
    return <p className="text-sm text-gray-600 dark:text-gray-400">Cargando orden...</p>;
  }
  if (!order) return null;

    return (
    <div className="rounded-lg shadow-lg p-4 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
        Orden de Cobro
      </h3>

      <div className="mb-3 text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded text-gray-800 dark:text-gray-100">
        <p><strong>Total:</strong> ${Number(order.total ?? 0).toFixed(2)}</p>
        <p><strong>Pagado:</strong> ${(Number(order.total ?? 0) - Number(order.balance_due ?? 0)).toFixed(2)}</p>
        <p><strong>Saldo pendiente:</strong> ${Number(order.balance_due ?? 0).toFixed(2)}</p>
        <p><strong>Estado:</strong> {order.status}</p>
      </div>

      {/* Ítems */}
      <button
        onClick={() => setShowItems(!showItems)}
        className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 
                   dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors mb-2"
      >
        {showItems ? "▼ Ítems" : "▶ Ítems"}
      </button>
      {showItems && (
        <div className="mb-4">
          <ul className="mb-3">
            {order.items?.length === 0 && (
              <li className="text-sm text-gray-600 dark:text-gray-400">Sin ítems</li>
            )}
            {order.items?.map((it: ChargeItem) => (
              <li key={it.id} className="border-b border-gray-200 dark:border-gray-700 py-1">
                {it.code} — {it.description} ({it.qty} × ${Number(it.unit_price).toFixed(2)})
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  = ${Number(it.subtotal).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          {!readOnly && (
            <form onSubmit={handleAddItem} className="flex flex-col gap-2">
              <input id="charge-item-code" type="text" placeholder="Servicio / Procedimiento"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                           bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600" required />
              <input id="charge-item-desc" type="text" placeholder="Detalle adicional (opcional)"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                           bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" />
              <input id="charge-item-qty" type="number" placeholder="Cantidad"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                           bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" required />
              <input id="charge-item-price" type="number" step="0.01" placeholder="Precio unitario"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                           bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" required />
              <button type="submit"
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 
                           dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors self-start">
                + Agregar ítem
              </button>
            </form>
          )}
        </div>
      )}

      {/* Pagos */}
      <button
        onClick={() => setShowPayments(!showPayments)}
        className="px-3 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 
                   dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors mb-2"
      >
        {showPayments ? "▼ Pagos" : "▶ Pagos"}
      </button>
      {showPayments && (
        <div>
          <ul className="mb-3">
            {order.payments?.length === 0 && (
              <li className="text-sm text-gray-600 dark:text-gray-400">Sin pagos registrados</li>
            )}
            {order.payments?.map((p: Payment) => (
              <li key={p.id} className="border-b border-gray-200 dark:border-gray-700 py-1">
                <strong>${Number(p.amount ?? 0).toFixed(2)}</strong> — {p.method}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {" "}{p.status} {p.reference_number && `| Ref: ${p.reference_number}`}
                </span>
              </li>
            ))}
          </ul>

          {!readOnly && (
            <form onSubmit={handleAddPayment} className="flex flex-col gap-2">
              <input type="number" step="0.01" placeholder="Monto" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                           bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600" required />
              <select value={method}
                onChange={(e) => setMethod(e.target.value as "cash" | "card" | "transfer" | "other")}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                           bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
                <option value="other">Otro</option>
              </select>

              {method === "card" && (
                <input type="text" placeholder="Referencia de tarjeta" value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                             bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" required />
              )}
              {method === "transfer" && (
                <>
                  <input type="text" placeholder="Banco" value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                               bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" required />
                  <input type="text" placeholder="Referencia de transferencia" value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                               bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" required />
                </>
              )}
              {method === "other" && (
                <input type="text" placeholder="Detalle del pago" value={otherDetail}
                  onChange={(e) => setOtherDetail(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                             bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100" required />
              )}

              <button type="submit"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors self-start"
                disabled={createPayment.isPending}>
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
