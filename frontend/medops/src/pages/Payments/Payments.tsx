// src/pages/Payments/Payments.tsx
import { useState } from "react";
import PageHeader from "@/components/Layout/PageHeader";
import ChargeOrderList from "@/components/Payments/ChargeOrderList";
import RegisterPaymentModal from "@/components/Payments/RegisterPaymentModal";

import { useChargeOrdersPaginated } from "@/hooks/payments/useChargeOrdersPaginated";
import { useChargeOrdersSearch } from "@/hooks/payments/useChargeOrdersSearch";
import { useChargeOrdersSummary } from "@/hooks/payments/useChargeOrdersSummary";

import type { ChargeOrder } from "@/types/payments";

export default function Payments() {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

  // --- Búsqueda institucional ---
  const {
    data: searchResults = [],
    isLoading: searchLoading,
    error: searchError,
  } = useChargeOrdersSearch(query);

  // --- Paginación institucional (solo cuando NO hay búsqueda) ---
  const {
    data: paginatedData,
    isLoading: paginatedLoading,
    error: paginatedError,
  } = useChargeOrdersPaginated(currentPage, pageSize);

  // --- Resumen institucional ---
  const { data: summary } = useChargeOrdersSummary();

  // --- Selección de dataset ---
  const isSearching = query.trim().length > 0;

  const orders: ChargeOrder[] = isSearching
    ? searchResults
    : paginatedData?.results ?? [];

  const loading = isSearching ? searchLoading : paginatedLoading;
  const error = isSearching ? searchError : paginatedError;

  const totalCount = isSearching
    ? orders.length
    : paginatedData?.count ?? 0;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalCount);

  const handleRegisterPayment = (orderId: number, appointmentId: number) => {
    setSelectedOrderId(orderId);
    setSelectedAppointmentId(appointmentId);
    setShowModal(true);
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header institucional */}
      <PageHeader
        title="Centro de Pagos"
        subtitle="Gestión de órdenes de cobro y pagos"
      />

      {/* Órdenes de Pago */}
      <section className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 bg-white dark:bg-gray-900">
        <h3 className="text-base sm:text-lg font-semibold text-[#0d2c53] dark:text-gray-100 mb-2 sm:mb-3">
          Órdenes de Pago
        </h3>

        {/* Resumen institucional */}
        {summary && (
          <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm mb-3">
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

        {/* Lista institucional */}
        <ChargeOrderList
          orders={orders}
          loading={loading}
          error={!!error}
          query={query}
          onQueryChange={(value) => {
            setQuery(value);
            setCurrentPage(1);
          }}
          onRegisterPayment={handleRegisterPayment}
        />

        {/* Paginación institucional (solo sin búsqueda) */}
        {!isSearching && totalCount > pageSize && (
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
      </section>

      {/* Modal de pago */}
      {showModal && selectedOrderId && (
        <RegisterPaymentModal
          appointmentId={selectedAppointmentId!}
          chargeOrderId={selectedOrderId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
