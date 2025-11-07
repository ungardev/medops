// src/components/Dashboard/FinancialSummaryWidget.tsx
import React from "react";
import type { DashboardSummary } from "@/types/dashboard";

export function FinancialSummaryWidget({ data }: { data?: DashboardSummary }) {
  const currency = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  if (!data) {
    return <div className="card text-muted">Cargando resumen financiero...</div>;
  }

  return (
    <section className="card">
      <h3>Resumen financiero</h3>
      <div className="grid">
        <div>
          <div className="summary-label">Facturado total</div>
          <div className="summary-value text-muted">
            {currency(data.total_payments_amount + data.financial_balance)}
          </div>
        </div>
        <div>
          <div className="summary-label">Confirmado</div>
          <div className="summary-value text-success">
            {currency(data.total_payments_amount)}
          </div>
        </div>
        <div>
          <div className="summary-label">Pendiente</div>
          <div className="summary-value text-warning">
            {currency(Math.max(data.financial_balance, 0))}
          </div>
        </div>
        <div>
          <div className="summary-label">Exonerado</div>
          <div className="summary-value text-danger">
            {currency(data.estimated_waived_amount)}
          </div>
        </div>
      </div>
    </section>
  );
}
