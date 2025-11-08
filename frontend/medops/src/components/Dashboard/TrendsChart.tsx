import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { useDashboard } from "@/hooks/dashboard/useDashboard";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

const TrendsChart: React.FC = () => {
  const [range, setRange] = useState<"day" | "week" | "month">("month");
  const [currency, setCurrency] = useState<"USD" | "VES">("USD");

  const { data, isLoading } = useDashboard({ range, currency });

  if (isLoading) return <p>Cargando tendencias...</p>;
  if (!data) return <p>No se pudo cargar la información de tendencias.</p>;

  const labels = data.appointments_trend.map((point) => point.date);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Citas completadas",
        data: data.appointments_trend.map((point) => point.value),
        borderColor: "#3b82f6", // azul institucional
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.3,
      },
      {
        label: `Pagos confirmados (${currency})`,
        data: data.payments_trend.map((point) => point.value),
        borderColor: "#22c55e", // verde institucional
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        tension: 0.3,
        yAxisID: "y1",
      },
      {
        label: `Balance financiero (${currency})`,
        data: data.balance_trend.map((point) => point.value),
        borderColor: "#ef4444", // rojo institucional
        backgroundColor: "rgba(239, 68, 68, 0.2)",
        tension: 0.3,
        yAxisID: "y1",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#374151",
          font: { size: 12 },
        },
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: { color: "#6b7280" },
        grid: { display: false },
      },
      y: {
        type: "linear" as const,
        position: "left" as const,
        ticks: { color: "#6b7280" },
        grid: { color: "#e5e7eb" },
      },
      y1: {
        type: "linear" as const,
        position: "right" as const,
        ticks: { color: "#6b7280" },
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <section className="dashboard-widget">
      <div className="widget-header">
        <h3>Tendencias</h3>
        <div className="widget-actions">
          {["day", "week", "month"].map((r) => (
            <button
              key={r}
              className={`btn ${range === r ? "btn-primary" : "btn-outline"}`}
              onClick={() => setRange(r as any)}
            >
              {r === "day" ? "Hoy" : r === "week" ? "Semana" : "Mes"}
            </button>
          ))}
          {["USD", "VES"].map((c) => (
            <button
              key={c}
              className={`btn ${currency === c ? "btn-primary" : "btn-outline"}`}
              onClick={() => setCurrency(c as any)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <Line data={chartData} options={chartOptions} />
    </section>
  );
};

export default TrendsChart;
