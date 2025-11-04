import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import PageHeader from "../../components/Layout/PageHeader";
import PaymentList from "../../components/Payments/PaymentList"; // ✅ ruta corregida
import { ChargeOrder } from "../../types/payments";

export default function ChargeOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading, error } = useQuery<ChargeOrder>({
    queryKey: ["charge-order", id],
    queryFn: async () => {
      const res = await axios.get(`/charge-orders/${id}/`);
      return res.data as ChargeOrder;
    },
  });

  if (isLoading) return <p className="text-muted">Cargando detalle de la orden...</p>;
  if (error || !order) return <p className="text-danger">Error cargando la orden</p>;

  const total = order.total_amount ?? order.total ?? 0;
  const paid = order.payments?.reduce((acc, p) => acc + Number(p.amount), 0) ?? 0;
  const pending = Number(total) - paid;

  return (
    <div className="charge-order-detail">
      <PageHeader
        title={`Orden de Pago #${order.id}`}
        subtitle={order.patient_detail?.full_name ?? `Paciente #${order.patient}`}
      />

      {/* Resumen financiero */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Resumen</h3>
        <div className="grid grid-cols-3 gap-4">
          <div><strong>Total:</strong> ${Number(total).toFixed(2)}</div>
          <div><strong>Pagado:</strong> ${paid.toFixed(2)}</div>
          <div><strong>Pendiente:</strong> ${pending.toFixed(2)}</div>
        </div>
      </section>

      {/* Items */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Cargos</h3>
        <table className="table w-full">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descripción</th>
              <th>Cant.</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => (
              <tr key={item.id}>
                <td>{item.code}</td>
                <td>{item.description}</td>
                <td>{item.qty}</td>
                <td>${Number(item.unit_price).toFixed(2)}</td>
                <td>${Number(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Pagos */}
      <section className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Historial de Pagos</h3>
        <PaymentList payments={order.payments || []} />
      </section>

      {/* Auditoría */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Auditoría</h3>
        <ul className="text-sm text-muted">
          <li>
            Creada por: {order.created_by ?? "—"} el{" "}
            {order.created_at ? new Date(order.created_at).toLocaleString() : "—"}
          </li>
          {order.updated_by && order.updated_at && (
            <li>
              Última actualización por: {order.updated_by} el{" "}
              {new Date(order.updated_at).toLocaleString()}
            </li>
          )}
        </ul>
      </section>

      {/* Acciones */}
      <div className="mt-6 flex gap-3">
        <button className="btn btn-primary">Registrar pago</button>
        <button className="btn btn-outline">Exportar</button>
        <button className="btn btn-danger">Anular orden</button>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Volver
        </button>
      </div>
    </div>
  );
}
