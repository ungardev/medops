// src/components/Dashboard/TrendsWidget.tsx
import React from "react";
import { Line } from "react-chartjs-2";
import type { DashboardSummary } from "@/types/dashboard";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

// Utilidad para leer variables CSS
const getCssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function TrendsWidget({ data }: { data?: DashboardSummary }) {
  if (!data) {
    return <div className="card text-muted">Cargando tendencias...</div>;
  }

  // Colores institucionales desde index.css
  const success = getCssVar("--success") || "#16a34a";
  const primary = getCssVar("--primary") || "#2563eb";
  const warning = getCssVar("--warning") || "#f59e0b";

  const labels = data.appointments_trend.map((p) => p.date);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Citas completadas",
        data: data.appointments_trend.map((p) => p.value),
        borderColor: success,
        backgroundColor: "rgba(22,163,74,0.2)",
      },
      {
        label: "Pagos confirmados (USD)",
        data: data.payments_trend.map((p) => p.value),
        borderColor: primary,
        backgroundColor: "rgba(37,99,235,0.2)",
        yAxisID: "y1",
      },
      {
        label: "Balance acumulado (USD)",
        data: data.balance_trend.map((p) => p.value),
        borderColor: warning,
        backgroundColor: "rgba(245,158,11,0.2)",
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: { mode: "index" as const, intersect: false },
    stacked: false,
    plugins: { legend: { position: "bottom" as const } },
    scales: {
      y: { type: "linear" as const, position: "left" as const },
      y1: {
        type: "linear" as const,
        position: "right" as const,
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <section className="card">
      <h3>Tendencias</h3>
      <p className="text-muted text-sm mb-2">
        Evolución de citas, pagos y balance en el tiempo
      </p>
      <Line data={chartData} options={options} />
    </section>
  );
}
