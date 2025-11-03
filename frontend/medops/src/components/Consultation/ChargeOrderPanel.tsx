import { useState } from "react";
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

  // --- Estado local para ítems ---
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);

  // --- Estado local para pagos ---
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");

  // Crear orden si no existe
  const handleCreateOrder = async () => {
    try {
      // 👇 ya no anteponemos /api, porque axios.defaults.baseURL = "/api"
      const res = await axios.post(`/appointments/${appointmentId}/charge-order/`);
      console.log("Respuesta crear orden:", res.status, res.data);
      await refetch();
    } catch (err) {
      console.error("Error creando orden:", err);
      alert("No se pudo crear la orden. Revisa consola/Network.");
    }
  };

  // Agregar ítem
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      const res = await axios.post("/charge-items/", {
        charge_order: order.id,
        code,
        description,
        qty,
        unit_price: unitPrice,
      });
      console.log("Respuesta agregar ítem:", res.status, res.data);
      setCode("");
      setDescription("");
      setQty(1);
      setUnitPrice(0);
      await refetch();
    } catch (err) {
      console.error("Error agregando ítem:", err);
    }
  };

  // Agregar pago
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !order) return;
    const payload: PaymentPayload = {
      charge_order: order.id,
      amount: parseFloat(amount),
      method,
      reference_number: reference || null,
    };
    createPayment.mutate(payload, {
      onSuccess: () => {
        console.log("Pago registrado correctamente");
        setAmount("");
        setMethod("cash");
        setReference("");
      },
      onError: (err) => {
        console.error("Error registrando pago:", err);
      },
    });
  };

  if (isLoading) return <p className="text-muted">Cargando orden...</p>;

  if (!order) {
    return (
      <div className="chargeorder-panel card">
        <h3 className="text-lg font-bold mb-2">Orden de Cobro</h3>
        <p className="text-muted">No hay orden asociada a esta consulta.</p>
        <button onClick={handleCreateOrder} className="btn-primary mt-2">
          + Crear orden
        </button>
      </div>
    );
  }

  return (
    <div className="chargeorder-panel card">
      <h3 className="text-lg font-bold mb-2">Orden de Cobro</h3>

      {/* Resumen */}
      <div className="mb-3 text-sm">
        <p><strong>Total:</strong> ${order.total.toFixed(2)}</p>
        <p><strong>Saldo pendiente:</strong> ${order.balance_due.toFixed(2)}</p>
        <p><strong>Estado:</strong> {order.status}</p>
      </div>

      {/* Ítems */}
      <h4 className="font-semibold">Ítems</h4>
      <ul className="mb-3">
        {order.items?.length === 0 && <li className="text-muted">Sin ítems</li>}
        {order.items?.map((it: ChargeItem) => (
          <li key={it.id} className="border-b py-1">
            {it.code} — {it.description} ({it.qty} × ${it.unit_price.toFixed(2)})
            <span className="ml-2 text-sm text-muted">= ${it.subtotal.toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddItem} className="flex flex-col gap-2 mb-4">
        <input
          type="text"
          placeholder="Código"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="input"
          required
        />
        <input
          type="text"
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
          required
        />
        <input
          type="number"
          placeholder="Cantidad"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="input"
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Precio unitario"
          value={unitPrice}
          onChange={(e) => setUnitPrice(Number(e.target.value))}
          className="input"
          required
        />
        <button type="submit" className="btn-secondary self-start">
          + Agregar ítem
        </button>
      </form>

      {/* Pagos */}
      <h4 className="font-semibold">Pagos</h4>
      <ul className="mb-3">
        {order.payments?.length === 0 && <li className="text-muted">Sin pagos registrados</li>}
        {order.payments?.map((p) => (
          <li key={p.id} className="border-b py-1">
            <strong>${Number(p.amount).toFixed(2)}</strong> — {p.method}
            <span className="text-sm text-muted">
              {" "}
              {p.status} {p.reference_number && `| Ref: ${p.reference_number}`}
            </span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddPayment} className="flex flex-col gap-2">
        <input
          type="number"
          step="0.01"
          placeholder="Monto"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="input"
          required
        />
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="select"
        >
          <option value="cash">Efectivo</option>
          <option value="card">Tarjeta</option>
          <option value="transfer">Transferencia</option>
          <option value="other">Otro</option>
        </select>
        <input
          type="text"
          placeholder="Referencia (opcional)"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="input"
        />
        <button
          type="submit"
          className="btn-primary self-start"
          disabled={createPayment.isPending}
        >
          {createPayment.isPending ? "Registrando..." : "+ Registrar pago"}
        </button>
        {createPayment.isError && (
          <p className="text-red-500 text-sm">
            Error al registrar el pago. Intente de nuevo.
          </p>
        )}
      </form>
    </div>
  );
}
