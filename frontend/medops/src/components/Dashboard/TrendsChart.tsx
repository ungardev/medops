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

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 min-h-[280px] sm:min-h-[300px]">
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando tendencias...</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 min-h-[280px] sm:min-h-[300px]">
        <p className="text-sm text-red-600 dark:text-red-400">
          No se pudo cargar la información de tendencias.
        </p>
      </section>
    );
  }

  const appointmentsTrend = data.appointments_trend || [];
  const paymentsTrend = data.payments_trend || [];
  const balanceTrend = data.balance_trend || [];
  const bcvRate = data.bcv_rate?.value;

  const hasData =
    appointmentsTrend.length > 0 ||
    paymentsTrend.length > 0 ||
    balanceTrend.length > 0;

  const labels = appointmentsTrend.map((p) => p.date);

  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const citasColor = isDarkMode ? "#3b82f6" : "#0d2c53";
  const citasBg = isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(13, 44, 83, 0.2)";

  const chartData = {
    labels,
    datasets: [
      {
        label: "Citas completadas",
        data: appointmentsTrend.map((p) => p.value ?? 0),
        borderColor: citasColor,
        backgroundColor: citasBg,
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
    maintainAspectRatio: false,
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
    <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 min-h-[280px] sm:min-h-[300px]">
      {/* Header */}
      <div className="flex flex-col md:space-y-2 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <h3 className="text-lg font-semibold text-[#0d2c53] dark:text-white text-center md:text-center lg:text-left mb-2 md:mb-0">
          Tendencias
        </h3>

        {/* Botonera: mobile dos líneas, tablet horizontal, desktop intacto */}
        <div className="flex flex-col gap-2 w-full lg:flex-row lg:justify-end lg:gap-2 mt-2 md:mt-0">
          <div className="grid grid-cols-3 gap-2 w-full lg:flex lg:justify-end lg:gap-2">
            {(["day", "week", "month"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`w-full px-3 py-1.5 text-sm rounded border transition-colors md:h-9 md:px-3 md:py-0 whitespace-nowrap ${
                  range === r
                    ? "bg-[#0d2c53] text-white border-[#0d2c53] hover:bg-[#0b2444] hover:text-white dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-200 dark:hover:text-black"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                {r === "day" ? "Hoy" : r === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 w-full lg:flex lg:justify-end lg:gap-2">
            {(["USD", "VES"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`w-full px-3 py-1.5 text-sm rounded border transition-colors md:h-9 md:px-3 md:py-0 whitespace-nowrap ${
                  currency === c
                    ? "bg-[#0d2c53] text-white border-[#0d2c53] hover:bg-[#0b2444] hover:text-white dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-200 dark:hover:text-black"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {currency === "VES" && typeof bcvRate === "number" && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Tasa BCV aplicada: {bcvRate.toFixed(2)} Bs/USD
        </p>
      )}

      {/* Chart or message */}
      {!hasData ? (
        <div className="h-40 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {range === "day" ? "No hay datos para hoy" : "No hay datos disponibles para el rango seleccionado"}
          </p>
        </div>
      ) : (
        <div className="relative w-full min-w-0 h-[240px] sm:h-[240px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      )}
    </section>
  );
};

export default TrendsChart;
