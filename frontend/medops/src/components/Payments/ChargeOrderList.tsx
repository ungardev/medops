import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import ChargeOrderRow from "./ChargeOrderRow";
import { ChargeOrder } from "../../types/payments";

export default function ChargeOrderList() {
  const { data: orders, isLoading, error } = useQuery<ChargeOrder[]>({
    queryKey: ["charge-orders"],
    queryFn: async () => {
      const res = await axios.get("/charge-orders/");
      return res.data as ChargeOrder[];
    },
  });

  if (isLoading) return <p className="text-muted">Cargando órdenes de cobro...</p>;
  if (error) return <p className="text-danger">Error cargando órdenes</p>;

  // --- Calcular totales ---
  const totals = orders?.reduce(
    (acc, order) => {
      const amount = parseFloat(order.total_amount || "0");
      acc.total += amount;
      if (order.status === "paid") acc.confirmed += amount;
      if (order.status === "pending") acc.pending += amount;
      if (order.status === "canceled") acc.failed += amount;
      return acc;
    },
    { total: 0, confirmed: 0, pending: 0, failed: 0 }
  );

  return (
    <div className="charge-orders">
      {/* Resumen de Totales compacto */}
      {totals && orders && orders.length > 0 && (
        <div className="summary flex gap-6 mb-4 text-sm">
          <span>
            <strong>Total:</strong> ${totals.total.toFixed(2)}
          </span>
          <span className="text-success">
            <strong>Confirmados:</strong> ${totals.confirmed.toFixed(2)}
          </span>
          <span className="text-warning">
            <strong>Pendientes:</strong> ${totals.pending.toFixed(2)}
          </span>
          <span className="text-danger">
            <strong>Fallidos:</strong> ${totals.failed.toFixed(2)}
          </span>
        </div>
      )}

      {/* Lista de órdenes o estado vacío */}
      {orders && orders.length > 0 ? (
        orders.map((order) => <ChargeOrderRow key={order.id} order={order} />)
      ) : (
        <div className="text-center text-muted py-6 border rounded">
          No hay órdenes de cobro registradas
        </div>
      )}
    </div>
  );
}
