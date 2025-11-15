import { useState, useEffect } from "react";
import {
  useChargeOrder,
  useCreatePayment,
  PaymentPayload,
} from "../../hooks/consultations/useChargeOrder";
import axios from "axios";

interface ChargeOrderPanelProps {
  appointmentId: number;
}

interface ChargeItem {
  id: number;
  code: string;
  description: string;
  qty: number;
  unit_price: number;
  subtotal: number;
}

export default function ChargeOrderPanel({ appointmentId }: ChargeOrderPanelProps) {
  const { data: order, isLoading, refetch } = useChargeOrder(appointmentId);
  const createPayment = useCreatePayment(order?.id, appointmentId);

  useEffect(() => {
    if (order === null && appointmentId) {
      axios
        .post(`/appointments/${appointmentId}/charge-order/`)
        .then(() => refetch())
        .catch((err) => {
          console.error("Error creando orden automáticamente:", err);
        });
    }
  }, [order, appointmentId, refetch]);

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [qty, setQty] = useState<string>("");
  const [unitPrice, setUnitPrice] = useState<string>("");

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "card" | "transfer" | "other">("cash");
  const [reference, setReference] = useState("");
  const [bank, setBank] = useState("");
  const [otherDetail, setOtherDetail] = useState("");

  const [showItems, setShowItems] = useState(false);
  const [showPayments, setShowPayments] = useState(false);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    const parsedQty = Number(qty);
    const parsedPrice = Number(unitPrice);

    if (!code.trim()) {
      console.error("Código requerido");
      return;
    }
    if (isNaN(parsedQty) || parsedQty <= 0) {
      console.error("Cantidad inválida");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      console.error("Precio inválido");
      return;
    }

    try {
      await axios.post("/charge-items/", {
        order: order.id,
        code: code.trim(),
        description: description.trim(),
        qty: parsedQty,
        unit_price: parsedPrice,
      });
      setCode("");
      setDescription("");
      setQty("");
      setUnitPrice("");
      await refetch();
    } catch (err: any) {
      console.error("Error agregando ítem:", err);
      if (err.response?.data) {
        console.error("Detalles del backend:", JSON.stringify(err.response.data, null, 2));
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
        refetch();
      },
      onError: (err) => {
        console.error("Error registrando pago:", err);
      },
    });
  };

  if (isLoading) return <p className="text-muted">Cargando orden...</p>;
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

          <form onSubmit={handleAddItem} className="flex flex-col gap-2">
            <input type="text" placeholder="Servicio / Procedimiento" value={code} onChange={(e) => setCode(e.target.value)} className="input" required />
            <input type="text" placeholder="Detalle adicional (opcional)" value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
            <input type="number" placeholder="Cantidad" value={qty} onChange={(e) => setQty(e.target.value)} className="input" required />
            <input type="number" step="0.01" placeholder="Precio unitario" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="input" required />
            <button type="submit" className="btn-secondary self-start">+ Agregar ítem</button>
          </form>
        </div>
      )}

      <button onClick={() => setShowPayments(!showPayments)} className="btn-toggle mb-2">
        {showPayments ? "▼ Pagos" : "▶ Pagos"}
      </button>
      {showPayments && (
        <div>
          <ul className="mb-3">
            {order.payments?.length === 0 && <li className="text-muted">Sin pagos registrados</li>}
            {order.payments?.map((p) => (
              <li key={p.id} className="border-b py-1">
                <strong>${Number(p.amount ?? 0).toFixed(2)}</strong> — {p.method}
                <span className="text-sm text-muted">
                  {" "}{p.status} {p.reference_number && `| Ref: ${p.reference_number}`}
                </span>
              </li>
            ))}
          </ul>

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
        </div>
      )}
    </div>
  );
}
