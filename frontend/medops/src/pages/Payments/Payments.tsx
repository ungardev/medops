// src/pages/Payments/Payments.tsx
import { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import ChargeOrderList from "@/components/Payments/ChargeOrderList";
import RegisterPaymentModal from "@/components/Payments/RegisterPaymentModal";
import PaymentsSummary from "@/components/Payments/PaymentsSummary";

import { useChargeOrdersPaginated } from "@/hooks/payments/useChargeOrdersPaginated";
import { useChargeOrdersSearch } from "@/hooks/payments/useChargeOrdersSearch";
import { useChargeOrdersSummary } from "@/hooks/payments/useChargeOrdersSummary";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  BanknotesIcon,
  CircleStackIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

import type { ChargeOrder } from "@/types/payments";

export default function Payments() {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);

  const { data: searchResults = [], isLoading: searchLoading, error: searchError } = useChargeOrdersSearch(query);
  const { data: paginatedData, isLoading: paginatedLoading, error: paginatedError } = useChargeOrdersPaginated(currentPage, pageSize);
  const { data: summary } = useChargeOrdersSummary();

  const isSearching = query.trim().length > 0;
  const orders: ChargeOrder[] = isSearching ? searchResults : paginatedData?.results ?? [];
  const loading = isSearching ? searchLoading : paginatedLoading;
  const error = isSearching ? searchError : paginatedError;

  const totalCount = isSearching ? orders.length : paginatedData?.count ?? 0;
  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalCount);

  const handleRegisterPayment = (orderId: number, appointmentId: number) => {
    setSelectedOrderId(orderId);
    setSelectedAppointmentId(appointmentId);
    setShowModal(true);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8 bg-[var(--palantir-bg)] min-h-screen">
      
      {/* HEADER TÉCNICO AJUSTADO A PageHeaderProps */}
      <PageHeader
        breadcrumb="MEDOPS // FINANCIAL_SYSTEM // ASSET_MANAGEMENT"
        title="FINANCIAL_LEDGER"
        stats={[
          { 
            label: "SYNC_STATUS", 
            value: "ACTIVE", 
            color: "text-emerald-500" 
          },
          { 
            label: "DB_RECORDS", 
            value: totalCount.toString().padStart(4, '0') 
          }
        ]}
        actions={
          <div className="flex items-center gap-3 px-3 py-1.5 bg-white/5 border border-white/10 rounded-sm">
            <ShieldCheckIcon className="w-3 h-3 text-[var(--palantir-muted)] opacity-50" />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--palantir-muted)]">
              AUTH: SECURE_CHANNEL
            </span>
          </div>
        }
      />

      {/* 📊 PANEL DE MÉTRICAS GLOBALES */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-2 px-1">
          <CircleStackIcon className="w-3.5 h-3.5 text-[var(--palantir-active)]" />
          <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--palantir-muted)]">
            Capital_Flow_Summary
          </h3>
        </div>
        <PaymentsSummary totals={summary} />
      </section>

      {/* 🖥️ MONITOR DE ÓRDENES DE CARGO */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <BanknotesIcon className="w-3.5 h-3.5 text-[var(--palantir-active)]" />
            <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-[var(--palantir-muted)]">
              Transaction_Buffer
            </h3>
          </div>
        </div>

        <div className="border border-[var(--palantir-border)] bg-black/20 rounded-sm overflow-hidden shadow-2xl backdrop-blur-sm">
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

          {/* PAGINACIÓN */}
          {!isSearching && totalCount > pageSize && (
            <div className="flex items-center justify-between p-4 border-t border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="group flex items-center gap-2 px-4 py-2 text-[9px] font-mono border border-white/10 hover:border-[var(--palantir-active)]/50 hover:bg-[var(--palantir-active)]/5 disabled:opacity-20 uppercase tracking-[0.2em] transition-all"
                >
                  <ChevronLeftIcon className="w-3 h-3 transition-transform group-hover:-translate-x-1" />
                  PREV_BLOCK
                </button>
                <button
                  disabled={endIdx >= totalCount}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="group flex items-center gap-2 px-4 py-2 text-[9px] font-mono border border-white/10 hover:border-[var(--palantir-active)]/50 hover:bg-[var(--palantir-active)]/5 disabled:opacity-20 uppercase tracking-[0.2em] transition-all"
                >
                  NEXT_BLOCK
                  <ChevronRightIcon className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-[9px] font-mono text-[var(--palantir-muted)] tracking-tighter">
                  RECORD_INDEX: {startIdx.toString().padStart(5, '0')} — {endIdx.toString().padStart(5, '0')}
                </span>
                <span className="text-[7px] font-mono text-[var(--palantir-active)]/40 uppercase">
                  Data_integrity_verified_v.1.0
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 🔐 MODAL DE PAGO */}
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
