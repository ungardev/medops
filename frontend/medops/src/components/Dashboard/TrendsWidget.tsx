// src/components/Dashboard/TrendsWidget.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import type { DashboardSummary } from '@/types/dashboard';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

// Registrar los componentes de Chart.js
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export function TrendsWidget({ data }: { data?: DashboardSummary }) {
  if (!data) return <div>Loading...</div>;

  const labels = data.appointments_trend.map(p => p.date);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Citas completadas',
        data: data.appointments_trend.map(p => p.value),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.2)',
      },
      {
        label: 'Pagos confirmados (USD)',
        data: data.payments_trend.map(p => p.value),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.2)',
        yAxisID: 'y1',
      },
      {
        label: 'Balance acumulado (USD)',
        data: data.balance_trend.map(p => p.value),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.2)',
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: { mode: 'index' as const, intersect: false },
    stacked: false,
    plugins: { legend: { position: 'bottom' as const } },
    scales: {
      y: { type: 'linear' as const, position: 'left' as const },
      y1: { type: 'linear' as const, position: 'right' as const, grid: { drawOnChartArea: false } },
    },
  };

  return (
    <section className="card">
      <h3>Tendencias</h3>
      <Line data={chartData} options={options} />
    </section>
  );
}
