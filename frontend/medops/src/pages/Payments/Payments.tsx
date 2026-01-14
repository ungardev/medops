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
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      
      {/* 🚀 HEADER TÉCNICO: Navegación Financiera */}
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPS", path: "/" },
          { label: "FINANCIAL_SYSTEM", path: "/payments" },
          { label: "ASSET_MANAGEMENT", active: true }
        ]}
        stats={[
          { 
            label: "TOTAL_REVENUE", 
            value: `$${summary?.confirmed?.toLocaleString() || "0.00"}`,
            color: "text-emerald-500 font-mono" 
          },
          { 
            label: "PENDING_ORDERS", 
            value: summary?.pending?.toString().padStart(3, '0') || "000",
            color: "text-amber-500"
          },
          { 
            label: "CORE_STATUS", 
            value: loading ? "SYNCING" : "STABLE",
            color: loading ? "animate-pulse text-blue-500" : "text-emerald-500/50"
          }
        ]}
        actions={
          <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-sm shadow-inner">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500/70" />
            <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40">
              Auth: Secure_Vault_Primary
            </span>
          </div>
        }
      />

      {/* 📊 PANEL DE MÉTRICAS GLOBALES */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-2 px-1 border-l-2 border-blue-600 ml-1">
          <CircleStackIcon className="w-3.5 h-3.5 text-blue-500" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
            Capital_Flow_Analysis
          </h3>
        </div>
        <PaymentsSummary totals={summary} />
      </section>

      {/* 🖥️ MONITOR DE TRANSACCIONES */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <BanknotesIcon className="w-3.5 h-3.5 text-blue-500" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
              Transaction_Buffer_Stream
            </h3>
          </div>
        </div>

        <div className="border border-white/10 bg-black/40 rounded-sm overflow-hidden shadow-2xl backdrop-blur-md">
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

          {/* PAGINACIÓN ESTILO CONSOLA */}
          {!isSearching && totalCount > pageSize && (
            <div className="flex items-center justify-between p-4 border-t border-white/5 bg-black/60">
              <div className="flex items-center gap-3">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="group flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-[0.2em] transition-all rounded-sm text-white/60"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                  Block_Prev
                </button>
                <button
                  disabled={endIdx >= totalCount}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="group flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 disabled:opacity-20 disabled:cursor-not-allowed uppercase tracking-[0.2em] transition-all rounded-sm text-white/60"
                >
                  Block_Next
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-[10px] font-mono text-white/20 tracking-tighter">
                  TRANSACTION_INDEX: <span className="text-blue-500">{startIdx.toString().padStart(4, '0')}</span> - {endIdx.toString().padStart(4, '0')} // TOTAL_SET: {totalCount}
                </span>
                <span className="text-[7px] font-mono text-blue-500/30 uppercase tracking-[0.3em] mt-1">
                  Secure_Ledger_Transmission_Verified
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
