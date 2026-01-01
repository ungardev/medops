import React, { useState } from "react";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import MetricCard from "./MetricCard";
import ButtonGroup from "@/components/Common/ButtonGroup";

const FinancialMetrics: React.FC = () => {
  const [currency, setCurrency] = useState<"USD" | "VES">("USD");
  const { data, isLoading, error } = useDashboard({ currency });

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-md ring-1 ring-gray-200 dark:ring-gray-700 p-3 sm:p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Cargando métricas financieras...
        </p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-md ring-1 ring-gray-200 dark:ring-gray-700 p-3 sm:p-4">
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
    <section className="bg-white dark:bg-gray-800 rounded-md ring-1 ring-gray-200 dark:ring-gray-700 p-3 sm:p-4 min-w-0">
      {/* Header compacto en una sola línea */}
      <div className="h-9 flex items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold text-[#0d2c53] dark:text-white">
          Indicadores Financieros
        </h3>

        <ButtonGroup
          options={["USD", "VES"]}
          selected={currency}
          onSelect={(c) => setCurrency(c as "USD" | "VES")}
        />
      </div>

      {/* Grid: 4 columnas desde md */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-3 min-w-0">
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
