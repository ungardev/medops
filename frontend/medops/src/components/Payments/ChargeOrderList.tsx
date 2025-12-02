// src/components/Payments/ChargeOrderList.tsx
import { useState, useMemo, useCallback } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import ChargeOrderRow from "./ChargeOrderRow";
import { ChargeOrder } from "../../types/payments";
import { useChargeOrdersPaginated } from "../../hooks/payments/useChargeOrdersPaginated";
import { useChargeOrdersSummary } from "../../hooks/payments/useChargeOrdersSummary";

export interface ChargeOrderListProps {
  onRegisterPayment?: (orderId: number, appointmentId: number) => void;
}

export default function ChargeOrderList({ onRegisterPayment }: ChargeOrderListProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const {
    data: paginatedData,
    isLoading,
    error,
  } = useChargeOrdersPaginated(currentPage, pageSize);

  const { data: searchResults, isLoading: searchLoading } = useQuery<ChargeOrder[]>({
    queryKey: ["charge-orders-search", query],
    queryFn: async (): Promise<ChargeOrder[]> => {
      type SearchResponse = ChargeOrder[] | { results: ChargeOrder[] };
      const res = await axios.get<SearchResponse>("/charge-orders/", {
        params: {
          search: query,
          ordering: "-appointment_date,-issued_at,-id",
        },
      });
      const payload = res.data;
      return Array.isArray(payload) ? payload : payload.results ?? [];
    },
    enabled: query.trim().length > 0,
  });

  const { data: summary } = useChargeOrdersSummary();

  const orders = query.trim().length > 0 ? searchResults ?? [] : paginatedData?.results ?? [];

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    const q = query.toLowerCase().trim();
    return orders.filter((o) => {
      const patientName = o.patient_detail?.full_name?.toLowerCase() ?? "";
      const orderId = String(o.id);
      return patientName.includes(q) || orderId.includes(q);
    });
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

  if (isLoading || searchLoading)
    return <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">Cargando órdenes de cobro...</p>;
  if (error)
    return <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">Error cargando órdenes</p>;

  const totalCount = query.trim().length > 0 ? orders.length : paginatedData?.count ?? 0;
  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Buscador */}
      <div>
        <label
          htmlFor="orderSearch"
          className="block text-xs sm:text-sm font-medium text-[#0d2c53] dark:text-gray-300 mb-1"
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
            setCurrentPage(1);
          }}
          onKeyDown={handleKeyDown}
          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                     bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                     focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
        />
      </div>

      {/* Resumen de Totales */}
      {summary && (
        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
          <span className="inline-flex items-center rounded-md px-2 py-1 font-medium bg-gray-100 dark:bg-gray-800 text-[#0d2c53] dark:text-gray-100">
            <strong>Total:</strong> ${summary.total.toFixed(2)}
          </span>
          <span className="inline-flex items-center rounded-md px-2 py-1 font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200">
            <strong>Confirmados:</strong> ${summary.confirmed.toFixed(2)}
          </span>
          <span className="inline-flex items-center rounded-md px-2 py-1 font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200">
            <strong>Pendientes:</strong> ${summary.pending.toFixed(2)}
          </span>
          <span className="inline-flex items-center rounded-md px-2 py-1 font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-200">
            <strong>Fallidos:</strong> ${summary.failed.toFixed(2)}
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
              onRegisterPayment={() => {
                onRegisterPayment?.(order.id, order.appointment);
              }}
            />
          ))
        ) : (
          <div className="text-center text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400 py-4 sm:py-6 italic">
            No se encontraron órdenes
          </div>
        )}
      </div>

      {/* Paginación */}
      {query.trim().length === 0 && totalCount > pageSize && (
        <div className="flex items-center justify-between text-xs sm:text-sm mt-3 sm:mt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className="px-2 sm:px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                       bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-[#0d2c53] dark:text-gray-100">
            Mostrando {startIdx}–{endIdx} de {totalCount}
          </span>
          <button
            disabled={endIdx >= totalCount}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-2 sm:px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 
                       bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-200 disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
