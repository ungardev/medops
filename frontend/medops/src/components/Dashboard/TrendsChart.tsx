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

  const appointmentsTrend = data.appointments_trend || [];
  const paymentsTrend = data.payments_trend || [];
  const balanceTrend = data.balance_trend || [];
  const bcvRate = data.bcv_rate?.value;

  const hasData =
    appointmentsTrend.length > 0 ||
    paymentsTrend.length > 0 ||
    balanceTrend.length > 0;

  if (!hasData) return <p>No hay datos disponibles para el rango seleccionado.</p>;

  const labels = appointmentsTrend.map((p) => p.date);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Citas completadas",
        data: appointmentsTrend.map((p) => p.value ?? 0),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.3,
      },
      {
        label: `Pagos confirmados (${currency})`,
        data: paymentsTrend.map((p) => p.value ?? 0),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        tension: 0.3,
        yAxisID: "y1",
      },
      {
        label: `Balance financiero (${currency})`,
        data: balanceTrend.map((p) => p.value ?? 0),
        borderColor: "#ef4444",
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
        {currency === "VES" && bcvRate && (
          <p className="text-xs text-gray-500 mt-1">
            Tasa BCV aplicada: {bcvRate.toFixed(2)} Bs/USD
          </p>
        )}
      </div>
      <Line data={chartData} options={chartOptions} />
    </section>
  );
};

export default TrendsChart;
