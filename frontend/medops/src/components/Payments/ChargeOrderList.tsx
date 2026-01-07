// src/components/Payments/ChargeOrderList.tsx
import ChargeOrderRow from "./ChargeOrderRow";
import { ChargeOrder } from "@/types/payments";
import { 
  MagnifyingGlassIcon, 
  CommandLineIcon,
  ArchiveBoxIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline";

export interface ChargeOrderListProps {
  orders: ChargeOrder[];
  loading: boolean;
  error: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onRegisterPayment?: (orderId: number, appointmentId: number) => void;
}

export default function ChargeOrderList({
  orders,
  loading,
  error,
  query,
  onQueryChange,
  onRegisterPayment,
}: ChargeOrderListProps) {
  return (
    <div className="space-y-0">
      {/* SECCIÓN DE BÚSQUEDA (COMMAND BAR STYLE) */}
      <div className="p-4 border-b border-[var(--palantir-border)] bg-white/[0.01]">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <CommandLineIcon className="h-4 w-4 text-[var(--palantir-active)] opacity-50 group-focus-within:opacity-100 transition-opacity" />
          </div>
          <input
            id="orderSearch"
            type="text"
            placeholder="EXECUTE_SEARCH: [PATIENT_NAME, ORDER_ID, DATE, AMOUNT]..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/5 rounded-sm 
                     text-[10px] font-mono tracking-wider text-[var(--palantir-text)]
                     placeholder:text-[var(--palantir-muted)] placeholder:text-[9px]
                     focus:outline-none focus:border-[var(--palantir-active)]/50 focus:ring-1 focus:ring-[var(--palantir-active)]/20
                     transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-[8px] font-mono text-[var(--palantir-muted)] opacity-0 group-focus-within:opacity-100 transition-opacity">
              QUERY_MODE_ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* ÁREA DE CONTENIDO / TABLA */}
      <div className="min-h-[400px]">
        {/* HEADER DE LA TABLA (OPCIONAL PERO RECOMENDADO PARA ALINEACIÓN) */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-2 bg-white/[0.03] border-b border-white/5 text-[8px] font-black uppercase tracking-[0.2em] text-[var(--palantir-muted)]">
          <div className="col-span-1">Ref_ID</div>
          <div className="col-span-4">Subject_Identifier</div>
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-2 text-right">Credit_Amount</div>
          <div className="col-span-2 text-center">Status_Flag</div>
          <div className="col-span-1"></div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-t-[var(--palantir-active)] border-white/5 rounded-full animate-spin" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--palantir-active)] animate-pulse">
              Syncing_Transaction_Buffer...
            </span>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-red-500 gap-2">
            <ExclamationCircleIcon className="w-8 h-8" />
            <span className="text-[10px] font-mono uppercase tracking-widest">
              Data_Access_Denied: Connection_Refused
            </span>
          </div>
        )}

        {/* LISTA DE RESULTADOS */}
        {!loading && !error && (
          <div className="divide-y divide-white/5">
            {orders.length > 0 ? (
              orders.map((order) => (
                <ChargeOrderRow
                  key={order.id}
                  order={order}
                  isSelected={false}
                  onRegisterPayment={() =>
                    onRegisterPayment?.(order.id, order.appointment)
                  }
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-30 gap-3 grayscale">
                <ArchiveBoxIcon className="w-10 h-10" />
                <div className="text-center">
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em]">Zero_Records_Found</p>
                  <p className="text-[8px] font-mono mt-1">NO_MATCHING_ENTRIES_IN_DATABASE</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
