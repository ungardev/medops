// src/components/Payments/ChargeOrderList.tsx
import ChargeOrderRow from "./ChargeOrderRow";
import { ChargeOrder } from "@/types/payments";

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
    <div className="space-y-4 sm:space-y-6">
      {/* Buscador institucional */}
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
          placeholder="Buscar por paciente, ID, fecha, monto..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs sm:text-sm 
                     bg-white dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100 
                     focus:outline-none focus:ring-2 focus:ring-[#0d2c53]"
        />
      </div>

      {/* Estado de carga */}
      {loading && (
        <p className="text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400">
          Cargando órdenes de cobro...
        </p>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
          Error cargando órdenes
        </p>
      )}

      {/* Lista */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-900">
        {!loading && orders.length > 0 ? (
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
        ) : !loading ? (
          <div className="text-center text-xs sm:text-sm text-[#0d2c53] dark:text-gray-400 py-4 sm:py-6 italic">
            No se encontraron órdenes
          </div>
        ) : null}
      </div>
    </div>
  );
}