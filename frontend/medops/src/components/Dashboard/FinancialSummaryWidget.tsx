import React from "react";
import type { DashboardSummary } from "@/types/dashboard";

export function FinancialSummaryWidget({ data }: { data?: DashboardSummary }) {
  const currency = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  if (!data) {
    return (
      <section className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-muted">Cargando resumen financiero...</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow p-6 space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Resumen financiero</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Facturado total */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Facturado total</span>
          <span className="text-lg font-bold text-gray-700">
            {currency(data.total_payments_amount + data.financial_balance)}
          </span>
        </div>

        {/* Confirmado */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Confirmado</span>
          <span className="text-lg font-bold text-success">
            {currency(data.total_payments_amount)}
          </span>
        </div>

        {/* Pendiente */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Pendiente</span>
          <span className="text-lg font-bold text-warning">
            {currency(Math.max(data.financial_balance, 0))}
          </span>
        </div>

        {/* Exonerado */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Exonerado</span>
          <span className="text-lg font-bold text-danger">
            {currency(data.estimated_waived_amount)}
          </span>
        </div>
      </div>
    </section>
  );
}
