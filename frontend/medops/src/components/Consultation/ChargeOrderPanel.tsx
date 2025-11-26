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

  // Estados para edición de ítems
  const [editItemId, setEditItemId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editQty, setEditQty] = useState(1);
  const [editPrice, setEditPrice] = useState(0);

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
    } catch (err) {
      console.error("Error actualizando ítem:", err);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este ítem?")) return;
    try {
      await axios.delete(`/charge-items/${id}/`);
      void refetch();
    } catch (err) {
      console.error("Error eliminando ítem:", err);
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

  if (!order) {
    return !readOnly && isAppointmentMode(props) ? (
      <button
        onClick={async () => {
          try {
            await axios.post(`/appointments/${props.appointmentId}/charge-order/`);
            void refetch();
          } catch (err) {
            console.error("Error creando orden:", err);
          }
        }}
        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        + Crear orden de cobro
      </button>
    ) : null;
  }

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
                {editItemId === it.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handleUpdateItem(it.id);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="px-2 py-1 border rounded"
                    />
                    <input
                      type="number"
                      value={editQty}
                      onChange={(e) => setEditQty(Number(e.target.value))}
                      className="px-2 py-1 border rounded w-16"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="px-2 py-1 border rounded w-24"
                    />
                    <button type="submit" className="bg-blue-600 text-white px-2 py-1 rounded">Guardar</button>
                    <button type="button" onClick={() => setEditItemId(null)} className="bg-gray-400 text-white px-2 py-1 rounded">Cancelar</button>
                  </form>
                ) : (
                  <>
                    {it.code} — {it.description ?? "Sin descripción"} ({it.qty} × ${Number(it.unit_price).toFixed(2)})
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      = ${Number(it.subtotal).toFixed(2)}
                    </span>
                    {!readOnly && (
                      <>
                        <button
                          onClick={() => {
                            setEditItemId(it.id);
                            setEditDescription(it.description ?? "");
                            setEditQty(it.qty ?? 1);
                            setEditPrice(it.unit_price ?? 0);
                          }}
                          className="ml-2 text-xs px-2 py-1 bg-yellow-500 text-white rounded"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => void handleDeleteItem(it.id)}
                          className="ml-2 text-xs px-2 py-1 bg-red-600 text-white rounded"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </>
                )}
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
              {/* ... resto del formulario de pagos igual que antes ... */}
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ChargeOrderPanel;
