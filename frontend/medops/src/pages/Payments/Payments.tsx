// src/pages/Payments/Payments.tsx
import { useState } from "react";
import PageHeader from "@/components/Common/PageHeader";
import ChargeOrderList from "@/components/Payments/ChargeOrderList";
import RegisterPaymentModal from "@/components/Payments/RegisterPaymentModal";
import PaymentsSummary from "@/components/Payments/PaymentsSummary";
import { useInstitutions } from "@/hooks/settings/useInstitutions"; // 🆕 IMPORTAR CONTEXTO
import { useChargeOrdersPaginated } from "@/hooks/payments/useChargeOrdersPaginated";
import { useChargeOrdersSearch } from "@/hooks/payments/useChargeOrdersSearch";
import { useChargeOrdersSummary } from "@/hooks/payments/useChargeOrdersSummary";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  BanknotesIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon // 🆕 ICONO INSTITUCIONAL
} from "@heroicons/react/24/outline";
import type { ChargeOrder, ChargeOrderStatus } from "@/types/payments";
export default function Payments() {
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [showModal, setShowModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  // 🆕 OBTENER CONTEXTO INSTITUCIONAL
  const { activeInstitution, institutions } = useInstitutions();
  const { data: searchResults, isLoading: searchLoading, error: searchError } = useChargeOrdersSearch(query);
  const { data: paginatedData, isLoading: paginatedLoading, error: paginatedError } = useChargeOrdersPaginated(currentPage, pageSize);
  const { data: summary } = useChargeOrdersSummary();
  const isSearching = query.trim().length > 0;
  // ✅ FIX 1: Array Type Safety - Añadir fallbacks para undefined
  const orders: ChargeOrder[] = isSearching ? (searchResults ?? []) : (paginatedData?.results ?? []);
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
      
      {/* 🚀 HEADER TÉCNICO: NAVEGACIÓN FINANCIERA MULTI-INSTITUCIONAL */}
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "PAYMENTS", active: true }
        ]}
        stats={[
          { 
            label: "ACTIVE_INSTITUTION", 
            value: activeInstitution?.name?.toUpperCase().slice(0, 12) || "NONE_SELECTED", 
            color: "text-purple-500 font-mono" 
          },
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
            color: loading ? "animate-pulse text-white" : "text-emerald-500/50"
          }
        ]}
        actions={
          <div className="flex items-center gap-2 px-4 py-2 bg-[#111] border border-white/10 rounded-sm shadow-xl">
            <BuildingOfficeIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[9px] font-mono text-purple-300 uppercase tracking-[0.2em]">
              Inst: {activeInstitution?.tax_id || "N/A"}
            </span>
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500/60" />
            <span className="text-[7px] font-mono text-emerald-500/40 uppercase tracking-[0.3em]">
              End-to-End_Encrypted
            </span>
          </div>
        }
      />
      
      {/* 📊 PANEL DE MÉTRICAS GLOBALES CON ANIMACIONES */}
      <section className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111] border border-white/10 rounded-sm p-4 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <BanknotesIcon className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40">TOTAL_REVENUE</span>
            </div>
            <div className="text-2xl font-bold text-emerald-500">
              ${summary?.confirmed?.toLocaleString() || "0.00"}
            </div>
            <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
              ALL_TRANSACTIONS
            </p>
          </div>
          
          <div className="bg-[#111] border border-white/10 rounded-sm p-4 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <CircleStackIcon className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40">PENDING_ORDERS</span>
            </div>
            <div className="text-2xl font-bold text-amber-500 animate-pulse">
              {summary?.pending?.toString().padStart(3, '0') || "000"}
            </div>
            <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">
              ACTIVE_ORDERS
            </p>
          </div>
          
          <div className="bg-[#111] border border-white/10 rounded-sm p-4 hover:border-white/20 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-white/40">CORE_STATUS</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${loading ? 'text-white' : 'text-emerald-500'}`}>
                {loading ? 'SYNCING' : 'STABLE'}
              </span>
            </div>
          </div>
        </div>
      </section>
      
      {/* 🔍 PANEL DE BÚSQUEDA Y FILTROS AVANZADOS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="GLOBAL_SEARCH_PROTOCOL..."
                className="w-full px-4 py-2.5 pr-12 bg-black/40 border border-white/10 rounded-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all appearance-none text-sm"
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-transparent animate-spin rounded-sm"></div>
                </div>
              )}
            </div>
          </div>
          
          {/* 🏷️ SELECTOR INSTITUCIONAL MEJORADO */}
          {institutions.length > 1 && (
            <div className="relative">
              <select
                value={activeInstitution?.id || ""}
                className="px-4 py-2.5 pr-10 bg-black/40 border border-white/10 rounded-sm text-white text-sm font-mono focus:outline-none focus:border-white/30 appearance-none uppercase cursor-pointer hover:bg-white/5 transition-all"
              >
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name.toUpperCase()} ({inst.tax_id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {/* 📋 LISTA DINÁMICA DE ORDENES DE COBRO */}
        <div className="border border-white/10 bg-[#111] rounded-sm overflow-hidden shadow-2xl">
          <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CircleStackIcon className="w-4 h-4 text-white/40" />
              <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/90">
                TRANSACTION_BUFFER_STREAM
              </h3>
            </div>
            
            {/* 📊 INDICADORES DE ESTADO */}
            <div className="flex items-center gap-4 text-[9px] font-mono text-white/30">
              <span>TOTAL_ENTRIES: <span className="text-white">{totalCount}</span></span>
              <span>RANGE: <span className="text-white">{startIdx}-{endIdx}</span></span>
              <span>STATUS: <span className="text-white">{loading ? 'LOADING' : 'READY'}</span></span>
            </div>
          </div>
          
          {/* 📄 LISTA DE ORDENES */}
          <div className="divide-y divide-white/5">
            {orders.length === 0 && !loading && !error && (
              <div className="flex flex-col items-center justify-center p-12 text-white/20">
                <BanknotesIcon className="w-8 h-8 text-white/40 mb-4" />
                <p className="text-[12px] font-mono uppercase tracking-widest italic">
                  NO_TRANSACTIONS_FOUND
                </p>
                <p className="text-[9px] font-mono text-white/30">
                  SEARCH_PROTOCOL_INACTIVE
                </p>
              </div>
            )}
            
            {error && (
              <div className="flex flex-col items-center justify-center p-12 text-red-500">
                <span className="text-[16px] font-mono mb-2">⚠</span>
                <p className="text-[12px] font-mono uppercase">TRANSACTION_ERROR</p>
                <p className="text-[10px] font-mono">{error?.message || error?.toString() || 'Unknown Error'}</p>
              </div>
            )}
            
            {loading && (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="w-8 h-8 border-2 border-white/20 border-t-transparent animate-spin rounded-sm mb-4"></div>
                <p className="text-[10px] font-mono uppercase text-white/30">LOADING_STREAM</p>
              </div>
            )}
            
            {orders.map((order, index) => (
              <div 
                key={order.id} 
                // ✅ FIX 2: Status Comparisons - Usar valores correctos del enum
                className={`group flex items-center justify-between p-4 hover:bg-white/5 transition-all cursor-pointer ${
                  order.status === 'paid' ? 'bg-emerald-500/10' : 
                  order.status === 'void' ? 'bg-red-500/10' : 
                  order.status === 'open' ? 'bg-amber-500/10' : ''
                }`}
                // ✅ FIX 3: Appointment Access - Usar appointment directamente
                onClick={() => handleRegisterPayment(order.id, order.appointment)}
              >
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <span className="text-[11px] font-mono text-white/60 mb-1">
                      {String(index + 1).padStart(3, '0').toUpperCase()}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[10px] font-bold text-white">
                        {/* ✅ FIX 4: Patient Access - Usar patient_detail o patient_name */}
                        Order #{order.id} - {order.patient_detail?.full_name || order.patient_name || 'SIN_PACIENTE'}
                      </p>
                      <p className="text-[9px] font-mono text-white/30">
                        {/* ✅ FIX 5: created_at Safety - Añadir fallback a issued_at */}
                        {new Date(order.created_at || order.issued_at).toLocaleString()}
                      </p>
                      <p className="text-[9px] font-mono text-white/30">
                        {/* ✅ FIX 6: Status Display - Añadir fallback */}
                        Status: {order.status?.toUpperCase() || 'UNKNOWN'}
                      </p>
                      {/* ✅ FIX 7: Eliminar completamente el bloque de 'notes' - NO existe en backend */}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[14px] font-bold text-white">
                      ${order.total?.toLocaleString() || "0.00"}
                    </span>
                    <p className="text-[9px] font-mono text-white/40 uppercase">
                      BALANCE: {order.balance_due?.toLocaleString() || "0.00"}
                    </p>
                  </div>
                  
                  <ChevronRightIcon className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))}
          </div>
          
          {/* 📄 CONTROLES DE PAGINACIÓN */}
          {!isSearching && totalCount > pageSize && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-white/[0.03]">
              <div className="text-[9px] font-mono text-white/30">
                <span>PER_PAGE: <span className="text-white/60">{pageSize}</span></span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-1 text-white/20 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                
                <button
                  disabled={endIdx >= totalCount}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1 text-white/20 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* 🔐 MODAL DE PAGO AUTOMÁTICO */}
      {showModal && selectedOrderId && (
        <RegisterPaymentModal
          open={showModal} // ✅ CORREGIDO: Usar showModal en lugar de open
          onClose={() => setShowModal(false)}
          appointmentId={selectedAppointmentId!}
          chargeOrderId={selectedOrderId}
        />
      )}
    </div>
  );
}