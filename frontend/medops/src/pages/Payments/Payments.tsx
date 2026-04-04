// src/pages/Payments/Payments.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/Common/PageHeader";
import PaymentsSummary from "@/components/Payments/PaymentsSummary";
import { useInstitutions } from "@/hooks/settings/useInstitutions";
import { useChargeOrdersPaginated } from "@/hooks/payments/useChargeOrdersPaginated";
import { useChargeOrdersSearch } from "@/hooks/payments/useChargeOrdersSearch";
import { useChargeOrdersSummary } from "@/hooks/payments/useChargeOrdersSummary";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  BanknotesIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";
import type { ChargeOrder, ChargeOrderStatus } from "@/types/payments";
export default function Payments() {
  const navigate = useNavigate();
  
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const { activeInstitution, institutions } = useInstitutions();
  const { data: searchResults, isLoading: searchLoading, error: searchError } = useChargeOrdersSearch(query);
  const { data: paginatedData, isLoading: paginatedLoading, error: paginatedError } = useChargeOrdersPaginated(currentPage, pageSize);
  const { data: summary } = useChargeOrdersSummary();
  const isSearching = query.trim().length > 0;
  
  const orders: ChargeOrder[] = isSearching ? (searchResults ?? []) : (paginatedData?.results ?? []);
  const loading = isSearching ? searchLoading : paginatedLoading;
  const error = isSearching ? searchError : paginatedError;
  const totalCount = isSearching ? orders.length : paginatedData?.count ?? 0;
  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalCount);
  
  const handleViewOrderDetail = (orderId: number) => {
    navigate(`/payments/${orderId}`);
  };
  
  const statusLabels: Record<string, string> = {
    open: 'Abierta',
    paid: 'Pagada',
    void: 'Anulada',
    partial: 'Parcial',
  };
  
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
      
      <PageHeader
        breadcrumbs={[
          { label: "MEDOPZ", path: "/" },
          { label: "Pagos", active: true }
        ]}
        stats={[
          { 
            label: "Institución", 
            value: activeInstitution?.name || "Ninguna", 
            color: "text-purple-400" 
          },
          { 
            label: "Ingresos", 
            value: `$${summary?.confirmed?.toLocaleString() || "0.00"}`, 
            color: "text-emerald-400" 
          },
          { 
            label: "Pendientes", 
            value: summary?.pending?.toString() || "0", 
            color: "text-amber-400"
          },
          { 
            label: "Estado", 
            value: loading ? "Cargando" : "Listo", 
            color: loading ? "animate-pulse text-amber-400" : "text-emerald-400"
          }
        ]}
        actions={
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/15 rounded-lg">
            <BuildingOfficeIcon className="w-4 h-4 text-white/30" />
            <span className="text-[10px] text-white/50">
              {activeInstitution?.tax_id || "N/A"}
            </span>
          </div>
        }
      />
      
      <section className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/15 rounded-lg p-5 hover:border-white/25 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <BanknotesIcon className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">Ingresos Totales</span>
            </div>
            <div className="text-2xl font-semibold text-emerald-400">
              ${summary?.confirmed?.toLocaleString() || "0.00"}
            </div>
            <p className="text-[9px] text-white/30 mt-1">
              Todas las transacciones
            </p>
          </div>
          
          <div 
            className="bg-white/5 border border-white/15 rounded-lg p-5 hover:border-amber-500/25 transition-all cursor-pointer group"
            onClick={() => navigate("/payments/pending")}
          >
            <div className="flex items-center gap-2 mb-3">
              <CircleStackIcon className="w-5 h-5 text-amber-400" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">Órdenes Pendientes</span>
            </div>
            <div className="text-2xl font-semibold text-amber-400">
              {summary?.pending?.toString() || "0"}
            </div>
            <p className="text-[9px] text-white/30 mt-1 group-hover:text-amber-400/60 transition-colors">
              Click para verificar
            </p>
          </div>
          
          <div className="bg-white/5 border border-white/15 rounded-lg p-5 hover:border-white/25 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">Estado del Sistema</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></div>
              <span className={`text-[11px] font-medium ${loading ? 'text-amber-400' : 'text-emerald-400'}`}>
                {loading ? 'Cargando' : 'Estable'}
              </span>
            </div>
          </div>
        </div>
      </section>
      
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative w-full">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar orden o paciente..."
                className="w-full px-4 py-2.5 pr-12 bg-white/5 border border-white/15 rounded-lg text-[12px] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 transition-all"
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-transparent animate-spin rounded-full"></div>
                </div>
              )}
            </div>
          </div>
          
          {institutions.length > 1 && (
            <div className="relative">
              <select
                value={activeInstitution?.id || ""}
                className="px-4 py-2.5 pr-10 bg-white/5 border border-white/15 rounded-lg text-[12px] text-white/70 focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer hover:bg-white/10 transition-all"
              >
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.tax_id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="border border-white/15 bg-white/5 rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CircleStackIcon className="w-5 h-5 text-white/30" />
              <h3 className="text-[11px] font-medium text-white/70">
                Órdenes de Cobro
              </h3>
            </div>
            
            <div className="flex items-center gap-4 text-[9px] text-white/30">
              <span>Total: <span className="text-white/60">{totalCount}</span></span>
              <span>Mostrando: <span className="text-white/60">{startIdx}-{endIdx}</span></span>
            </div>
          </div>
          
          <div className="divide-y divide-white/5">
            {orders.length === 0 && !loading && !error && (
              <div className="flex flex-col items-center justify-center p-12 text-white/20">
                <BanknotesIcon className="w-8 h-8 text-white/15 mb-4" />
                <p className="text-[11px] text-white/30">
                  No se encontraron transacciones
                </p>
              </div>
            )}
            
            {error && (
              <div className="flex flex-col items-center justify-center p-12 text-red-400">
                <span className="text-[16px] mb-2">⚠</span>
                <p className="text-[11px]">Error al cargar transacciones</p>
                <p className="text-[10px] text-red-400/60">{error?.message || error?.toString() || 'Error desconocido'}</p>
              </div>
            )}
            
            {loading && (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="w-8 h-8 border-2 border-white/20 border-t-transparent animate-spin rounded-full mb-4"></div>
                <p className="text-[10px] text-white/30">Cargando...</p>
              </div>
            )}
            
            {orders.map((order, index) => (
              <div 
                key={order.id} 
                className={`group flex items-center justify-between p-4 hover:bg-white/5 transition-all cursor-pointer ${
                  order.status === 'paid' ? 'bg-emerald-500/5' : 
                  order.status === 'void' ? 'bg-red-500/5' : 
                  order.status === 'open' ? 'bg-amber-500/5' : ''
                }`}
                onClick={() => handleViewOrderDetail(order.id)}
              >
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <span className="text-[10px] text-white/30 mt-0.5">
                      {String(index + 1).padStart(3, '0')}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[11px] font-medium text-white/80">
                        Orden #{order.id} - {order.patient_detail?.full_name || order.patient_name || 'Sin paciente'}
                      </p>
                      <p className="text-[9px] text-white/30">
                        {new Date(order.created_at || order.issued_at).toLocaleDateString("es-VE")}
                      </p>
                      <p className="text-[9px] text-white/30">
                        Estado: {statusLabels[order.status] || order.status || 'Desconocido'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[14px] font-semibold text-white/80">
                      ${order.total?.toLocaleString() || "0.00"}
                    </span>
                    <p className="text-[9px] text-white/30">
                      Pendiente: {order.balance_due?.toLocaleString() || "0.00"}
                    </p>
                  </div>
                  
                  <ChevronRightIcon className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
              </div>
            ))}
          </div>
          
          {!isSearching && totalCount > pageSize && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-white/5">
              <div className="text-[9px] text-white/30">
                Por página: <span className="text-white/50">{pageSize}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-2 text-white/20 hover:text-white/60 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all rounded-lg"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                
                <button
                  disabled={endIdx >= totalCount}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-2 text-white/20 hover:text-white/60 hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all rounded-lg"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}