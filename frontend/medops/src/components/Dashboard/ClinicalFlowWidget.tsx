import React from 'react';
import type { DashboardSummary } from '@/types/dashboard';

export function ClinicalFlowWidget({ data }: { data?: DashboardSummary }) {
  if (!data) return <div>Loading...</div>;
  return (
    <section className="card">
      <h3>Flujo clínico del día</h3>
      <div className="grid">
        <div><div className="label">Citas</div><div className="value">{data.total_appointments}</div></div>
        <div><div className="label">Completadas</div><div className="value">{data.completed_appointments}</div></div>
        <div><div className="label">Pendientes</div><div className="value">{data.pending_appointments}</div></div>
        <div><div className="label">Exoneradas</div><div className="value">{data.total_waived}</div></div>
      </div>
    </section>
  );
}
