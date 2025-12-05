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
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4">
      {/* Header: tablet vertical centrado, desktop horizontal intacto */}
      <div className="flex flex-col md:space-y-2 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between lg:gap-4 min-w-0">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white text-center md:text-center lg:text-left whitespace-nowrap mb-2 md:mb-0">
          Indicadores Financieros
        </h3>

        {/* Botones: mobile con espacio extra arriba, tablet/desktop intactos */}
        <div className="flex w-full flex-row flex-nowrap gap-2 md:gap-2 lg:justify-end mt-2 md:mt-0">
          {["USD", "VES"].map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c as "USD" | "VES")}
              className={`flex-1 basis-0 px-3 py-1.5 text-sm rounded border transition-colors md:h-9 md:px-3 md:py-0 whitespace-nowrap ${
                currency === c
                  ? "bg-[#0d2c53] text-white border-[#0d2c53] dark:bg-white dark:text-[#0d2c53] dark:border-white hover:bg-[#09325f] dark:hover:bg-gray-200"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        <MetricCard
          title="Total"
          value={formatAmount(data.total_payments_amount)}
          subtitle="Operaciones Completadas"
        />
        <MetricCard
          title="Pagos"
          value={data.total_payments}
          subtitle="Confirmados"
        />
        <MetricCard
          title="Exonerado"
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
