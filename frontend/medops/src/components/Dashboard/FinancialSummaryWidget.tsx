import React from 'react';
import type { DashboardSummary } from '@/types/dashboard';

export function FinancialSummaryWidget({ data }: { data?: DashboardSummary }) {
  if (!data) return <div>Loading...</div>;
  const currency = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

  return (
    <section className="card">
      <h3>Resumen financiero</h3>
      <div className="grid">
        <div><div className="label">Facturado total</div><div className="value">{currency(data.total_payments_amount + data.financial_balance)}</div></div>
        <div><div className="label">Confirmado</div><div className="value">{currency(data.total_payments_amount)}</div></div>
        <div><div className="label">Pendiente</div><div className="value">{currency(Math.max(data.financial_balance, 0))}</div></div>
        <div><div className="label">Exonerado</div><div className="value">{currency(data.estimated_waived_amount)}</div></div>
      </div>
    </section>
  );
}
