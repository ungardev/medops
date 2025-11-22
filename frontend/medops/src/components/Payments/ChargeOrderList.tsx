// src/components/Payments/ChargeOrderList.tsx
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState, useMemo, useCallback } from "react";
import ChargeOrderRow from "./ChargeOrderRow";
import RegisterPaymentModal from "../Dashboard/RegisterPaymentModal";
import { ChargeOrder } from "../../types/payments";

export default function ChargeOrderList() {
  const { data: orders, isLoading, error } = useQuery<ChargeOrder[]>({
    queryKey: ["charge-orders"],
    queryFn: async () => {
      const res = await axios.get("/charge-orders/");
      return res.data as ChargeOrder[];
    },
  });

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedOrder, setSelectedOrder] = useState<ChargeOrder | null>(null);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const q = query.toLowerCase().trim();
    let result = orders.filter((o) => {
      const patientName = o.patient_detail?.full_name?.toLowerCase() ?? "";
      const orderId = String(o.id);
      return patientName.includes(q) || orderId.includes(q);
    });
    result.sort((a, b) => {
      const dateA = new Date(a.appointment_date || a.issued_at || "").getTime();
      const dateB = new Date(b.appointment_date || b.issued_at || "").getTime();
      return dateB - dateA;
    });
    return result;
  }, [orders, query]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (filteredOrders.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredOrders.length - 1 ? prev + 1 : prev
        );
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      }
      if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        const selected = filteredOrders[selectedIndex];
        console.log("Seleccionado con Enter:", selected.id);
      }
    },
    [filteredOrders, selectedIndex]
  );

  if (isLoading)
    return <p className="text-sm text-gray-600 dark:text-gray-400">Cargando órdenes de cobro...</p>;
  if (error)
    return <p className="text-sm text-red-600 dark:text-red-400">Error cargando órdenes</p>;

  const totals = orders?.reduce(
    (acc, order) => {
      const raw = order.total_amount ?? order.total ?? 0;
      const amt =
        typeof raw === "string" ? parseFloat(raw || "0") : Number(raw || 0);
      acc.total += amt;
      if (order.status === "paid") acc.confirmed += amt;
      if (order.status === "open" || order.status === "partially_paid") acc.pending += amt;
      if (order.status === "void") acc.failed += amt;
      return acc;
    },
    { total: 0, confirmed: 0, pending: 0, failed: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Buscador */}
      <div>
        <label
          htmlFor="orderSearch"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Buscar órdenes
        </label>
        <input
          id="orderSearch"
          type="text"
          placeholder="Buscar por paciente o ID..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm 
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 
                     focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>

      {/* Resumen de Totales */}
      {totals && orders && orders.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center rounded-md px-2 py-1 font-medium bg-gray-100 dark:bg-gray-800">
            <strong>Total:</strong> ${totals.total.toFixed(2)}
          </span>
          <span className="inline-flex items-center rounded-md px-2 py-1 font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
            <strong>Confirmados:</strong> ${totals.confirmed.toFixed(2)}
          </span>
          <span className="inline-flex items-center rounded-md px-2 py-1 font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200">
            <strong>Pendientes:</strong> ${totals.pending.toFixed(2)}
          </span>
          <span className="inline-flex items-center rounded-md px-2 py-1 font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200">
            <strong>Fallidos:</strong> ${totals.failed.toFixed(2)}
          </span>
        </div>
      )}

      {/* Lista filtrada */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, idx) => (
            <ChargeOrderRow
              key={order.id}
              order={order}
              isSelected={idx === selectedIndex}
              onRegisterPayment={() => setSelectedOrder(order)}
            />
          ))
        ) : (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-6 italic">
            No se encontraron órdenes
          </div>
        )}
      </div>

      {/* Modal de Registrar Pago */}
      {selectedOrder && (
        <RegisterPaymentModal
          chargeOrderId={selectedOrder.id}
          appointmentId={selectedOrder.appointment ?? undefined}
          onClose={() => setSelectedOrder(null)}
          onSuccess={() => {
            console.log("Pago registrado en orden", selectedOrder.id);
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}
