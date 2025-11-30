import React, { useState } from "react";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import MetricCard from "./MetricCard";

const FinancialMetrics: React.FC = () => {
  const [currency, setCurrency] = useState<"USD" | "VES">("USD");
  const { data, isLoading } = useDashboard({ currency });

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 lg:p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cargando métricas financieras...
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 lg:p-6">
        <p className="text-sm text-red-600 dark:text-red-400">
          No se pudo cargar la información financiera.
        </p>
      </section>
    );
  }

  const formatAmount = (amount: number) =>
    currency === "USD"
      ? `$${amount.toLocaleString()}`
      : `${amount.toLocaleString()} Bs`;

  return (
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          Indicadores Financieros
        </h3>
        <div className="flex gap-2 w-full sm:w-auto">
          {["USD", "VES"].map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c as "USD" | "VES")}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-sm rounded border transition-colors ${
                currency === c
                  ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-gray-200 dark:hover:text-black"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total transacciones"
          value={formatAmount(data.total_payments_amount)}
          subtitle="Mes actual"
        />
        <MetricCard
          title="Pagos confirmados"
          value={data.total_payments}
          subtitle="Procesados"
        />
        <MetricCard
          title="Exoneraciones"
          value={data.total_waived}
          subtitle={`Monto estimado: ${formatAmount(data.estimated_waived_amount)}`}
        />
        <MetricCard
          title="Órdenes anuladas"
          value={data.total_canceled_orders}
          subtitle="Últimos 30 días"
        />
      </div>
    </section>
  );
};

export default FinancialMetrics;
