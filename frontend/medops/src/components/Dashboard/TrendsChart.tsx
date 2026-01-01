// src/components/Dashboard/TrendsChart.tsx
import React, { useState, useRef, useLayoutEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
  type ChartOptions,
} from "chart.js";
import { useDashboard } from "@/hooks/dashboard/useDashboard";
import ButtonGroup from "@/components/Common/ButtonGroup";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

const TrendsChart: React.FC = () => {
  const [range, setRange] = useState<"day" | "week" | "month">("month");
  const [currency, setCurrency] = useState<"USD" | "VES">("USD");
  const { data } = useDashboard({ range, currency });
  const chartRef = useRef<any>(null);
  const [chartData, setChartData] = useState<any>(null);

  const citas = data?.appointments_trend || [];
  const pagos = data?.payments_trend || [];
  const balance = data?.balance_trend || [];

  console.log("📊 Citas:", citas);
  console.log("📊 Pagos:", pagos);
  console.log("📊 Balance:", balance);

  // Construir rango continuo de fechas
  const buildContinuousLabels = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const labels: string[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      labels.push(d.toISOString().split("T")[0]);
    }
    return labels;
  };

  // Obtener min/max sin ordenar todo el arreglo dos veces
  const allDates = [
    ...citas.map((p: any) => p.date),
    ...pagos.map((p: any) => p.date),
    ...balance.map((p: any) => p.date),
  ].filter(Boolean);

  let labels: string[] = [];
  if (allDates.length) {
    const minDate = allDates.reduce((min, d) => (d < min ? d : min), allDates[0]);
    const maxDate = allDates.reduce((max, d) => (d > max ? d : max), allDates[0]);
    labels = buildContinuousLabels(minDate, maxDate);
  }

  console.log("📅 Labels continuos:", labels);

  const hasData = citas.length || pagos.length || balance.length;
  console.log("✅ hasData:", hasData);

  // Colores base en strings
  const baseColors: Record<string, string> = {
    citas: "rgba(13,44,83,0.4)",
    pagos: "rgba(34,197,94,0.4)",
    balance: "rgba(239,68,68,0.4)",
  };

  const buildGradient = (ctx: CanvasRenderingContext2D, color: string) => {
    console.log("🎨 Generando gradiente con color:", color);
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    return gradient;
  };

  // Render inicial sin gradientes
  useLayoutEffect(() => {
    if (hasData && labels.length) {
      console.log("🚀 Construyendo chartData inicial sin gradientes");

      const citasData = labels.map((date) => {
        const found = citas.find((p: any) => p.date === date);
        return typeof found?.value === "number" ? found.value : 0;
      });

      const pagosData = labels.map((date) => {
        const found = pagos.find((p: any) => p.date === date);
        return typeof found?.value === "number" ? found.value : 0;
      });

      const balanceData = labels.map((date) => {
        const found = balance.find((p: any) => p.date === date);
        return typeof found?.value === "number" ? found.value : 0;
      });

      const newChartData = {
        labels,
        datasets: [
          {
            label: "Citas",
            data: citasData,
            borderColor: "#0d2c53",
            backgroundColor: baseColors.citas,
            fill: true,
            tension: 0.5,
            pointRadius: 0,
          },
          {
            label: `Pagos (${currency})`,
            data: pagosData,
            borderColor: "#22c55e",
            backgroundColor: baseColors.pagos,
            fill: true,
            tension: 0.5,
            pointRadius: 0,
          },
          {
            label: `Balance (${currency})`,
            data: balanceData,
            borderColor: "#ef4444",
            backgroundColor: baseColors.balance,
            fill: true,
            tension: 0.5,
            pointRadius: 0,
          },
        ],
      };
      setChartData(newChartData);
    }
  }, [hasData, currency, labels.join("|")]);

  // Inyección de gradientes en caliente
  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      console.log("🧠 chartRef:", chartRef.current);
      console.log("🧠 ctx:", chartRef.current?.ctx);
      if (chartRef.current && chartRef.current.ctx && chartData) {
        const ctx = chartRef.current.ctx;
        console.log("🎯 Inyectando gradientes en datasets");
        const updated = {
          ...chartData,
          datasets: [
            {
              ...chartData.datasets[0],
              backgroundColor: buildGradient(ctx, baseColors.citas),
            },
            {
              ...chartData.datasets[1],
              backgroundColor: buildGradient(ctx, baseColors.pagos),
            },
            {
              ...chartData.datasets[2],
              backgroundColor: buildGradient(ctx, baseColors.balance),
            },
          ],
        };
        setChartData(updated);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [chartData]);

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: "easeOutQuart",
    },
    layout: {
      padding: { top: 16, bottom: 8 },
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#374151",
          font: { size: 12 },
          boxWidth: 12,
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#0d2c53",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#fff",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: "#6b7280" },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#6b7280" },
        grid: { color: "#e5e7eb" },
      },
    },
  };

  return (
    <section className="h-full bg-white dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 rounded-md p-3 sm:p-4 flex flex-col">
      {/* Header compacto */}
      <div className="h-9 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#0d2c53] dark:text-white">Tendencias</h3>
        <div className="flex gap-2">
          <ButtonGroup
            options={["day", "week", "month"]}
            selected={range}
            onSelect={(r) => setRange(r as any)}
          />
          <ButtonGroup
            options={["USD", "VES"]}
            selected={currency}
            onSelect={(c) => setCurrency(c as any)}
          />
        </div>
      </div>

      {/* Gráfico blindado */}
      <div className="flex-1 mt-3">
        {!hasData ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
            No hay datos disponibles
          </div>
        ) : !chartData ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
            Cargando tendencias...
          </div>
        ) : (
          <div className="relative w-full h-full">
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          </div>
        )}
      </div>
    </section>
  );
};

export default TrendsChart;
