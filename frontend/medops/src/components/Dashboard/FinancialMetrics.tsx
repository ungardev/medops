import React, { useState } from "react";
import { useDashboard } from "@/hooks/dashboard/useDashboard"; // ✅ usar useDashboard
import MetricCard from "./MetricCard";

const FinancialMetrics: React.FC = () => {
  const [currency, setCurrency] = useState<"USD" | "VES">("USD");
  const { data, isLoading } = useDashboard({ currency }); // ✅ pasar currency al hook

  if (isLoading) return <p>Cargando métricas financieras...</p>;
  if (!data) return <p>No se pudo cargar la información financiera.</p>;

  // 🔹 El backend ya devuelve los montos convertidos según currency
  const formatAmount = (amount: number) =>
    currency === "USD"
      ? `$${amount.toLocaleString()}`
      : `${amount.toLocaleString()} Bs`;

  return (
    <section className="dashboard-widget">
      <div className="widget-header">
        <h3>Indicadores financieros</h3>
        <div className="widget-actions">
          {["USD", "VES"].map((c) => (
            <button
              key={c}
              className={`btn ${currency === c ? "btn-primary" : "btn-outline"}`}
              onClick={() => setCurrency(c as "USD" | "VES")}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard
          title="Total transacciones"
          value={formatAmount(data.total_payments_amount)}
          subtitle="Mes actual"
        />
        <MetricCard
          title="Pagos confirmados"
          value={data.total_payments}
          variant="ok"
        />
        <MetricCard
          title="Exoneraciones"
          value={data.total_waived}
          subtitle={`Monto estimado: ${formatAmount(data.estimated_waived_amount)}`}
        />
        <MetricCard
          title="Órdenes anuladas"
          value={data.total_events}
          variant={data.total_events > 0 ? "critical" : "ok"}
        />
      </div>
    </section>
  );
};

export default FinancialMetrics;
