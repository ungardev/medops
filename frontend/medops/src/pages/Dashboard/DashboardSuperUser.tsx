import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// 🔹 Nuevos imports para filtros elegantes
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";

import { getDashboardSummary, DashboardSummary } from "../../api/dashboard";
import { mockDashboardSummary } from "../../mocks/dashboardSummary"; // fallback

export default function DashboardSuperUser() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Estados para filtros
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<string>("");

  // Estado de carga
  const [loading, setLoading] = useState(false);

  const fetchSummary = () => {
    setLoading(true);
    getDashboardSummary(
      startDate ? startDate.toISOString().split("T")[0] : undefined,
      endDate ? endDate.toISOString().split("T")[0] : undefined,
      status || undefined
    )
      .then(setSummary)
      .catch(() => {
        console.warn("⚠️ Usando datos mock porque el backend no respondió");
        setSummary(mockDashboardSummary);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (!summary) return <p>Cargando métricas...</p>;

  const COLORS = ["#0088FE", "#FF8042", "#00C49F", "#FFBB28"];

  // Datos para gráficos
  const appointmentsData = [
    { name: "Completadas", value: summary.completed_appointments },
    { name: "Pendientes", value: summary.pending_appointments },
  ];

  const financeData = [
    { name: "Pagos", value: summary.total_payments },
    { name: "Exoneradas", value: summary.total_waived },
  ];

  // Exportación a PDF
  const handleExportPDF = async () => {
    try {
      const input = document.getElementById("dashboard-content");
      if (!input) return;
      const canvas = await html2canvas(input, { scale: 1 });
      const imgData = canvas.toDataURL("image/jpeg", 0.7);
      const pdf = new jsPDF("p", "mm", "a4");

      pdf.setFillColor("#FFFFFF");
      pdf.rect(0, 0, 210, 297, "F");
      pdf.setTextColor("#000000");
      pdf.setFontSize(22);
      pdf.text("Reporte Ejecutivo - MedOps", 20, 50);
      pdf.setFontSize(14);
      pdf.text(`Generado: ${new Date().toLocaleDateString()}`, 20, 70);

      pdf.addPage();
      //const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      //const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      //pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

      pdf.save(`dashboard_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("❌ Error al generar PDF:", err);
    }
  };

  return (
    <div>
      <h1>📊 Dashboard Ejecutivo</h1>

      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          background: darkMode ? "#444" : "#0088FE",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginRight: "1rem"
        }}
      >
        {darkMode ? "☀️ Modo claro" : "🌙 Modo oscuro"}
      </button>

      <button
        onClick={handleExportPDF}
        style={{
          marginBottom: "1rem",
          padding: "0.5rem 1rem",
          background: "#00C49F",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        📄 Exportar a PDF (Versión Ejecutiva)
      </button>

      {/* 🔹 Filtros */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          alignItems: "center"
        }}
      >
        <div>
          <label>📅 Desde: </label>
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="Selecciona fecha"
          />
        </div>

        <div>
          <label>📅 Hasta: </label>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            dateFormat="dd/MM/yyyy"
            placeholderText="Selecciona fecha"
          />
        </div>

        <div style={{ minWidth: "200px" }}>
          <label>📌 Estado: </label>
          <Select
            options={[
              { value: "", label: "Todos" },
              { value: "completed", label: "Completadas" },
              { value: "pending", label: "Pendientes" },
              { value: "cancelled", label: "Canceladas" },
            ]}
            value={[
              { value: "", label: "Todos" },
              { value: "completed", label: "Completadas" },
              { value: "pending", label: "Pendientes" },
              { value: "cancelled", label: "Canceladas" },
            ].find((opt) => opt.value === status)}
            onChange={(opt) => setStatus(opt?.value || "")}
          />
        </div>

        <button
          onClick={fetchSummary}
          style={{
            padding: "0.5rem 1rem",
            background: "#0088FE",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Aplicar filtros
        </button>

        <button
          onClick={() => {
            setStartDate(null);
            setEndDate(null);
            setStatus("");
            fetchSummary();
          }}
          style={{
            padding: "0.5rem 1rem",
            background: "#FF8042",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Limpiar filtros
        </button>
      </div>

      {/* 🔹 Spinner */}
      {loading && (
        <div style={{ textAlign: "center", margin: "1rem 0" }}>
          <div className="spinner"></div>
          <p style={{ marginTop: "0.5rem" }}>Cargando datos...</p>
        </div>
      )}

      <div
        id="dashboard-content"
        style={{
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#f5f5f5" : "#000",
          padding: "1rem",
          borderRadius: "8px"
        }}
      >
        {/* 🔹 Resumen ejecutivo */}
        <div
          style={{
            background: darkMode ? "#2a2a2a" : "#f4f6f8",
            border: darkMode ? "1px solid #555" : "1px solid #ccc",
            padding: "1rem",
            marginBottom: "2rem",
            borderRadius: "6px"
          }}
        >
          <h2>Resumen Ejecutivo</h2>
          <p>
            Pacientes totales: <strong>{summary.total_patients}</strong> | Citas:{" "}
            <strong>{summary.total_appointments}</strong> (Completadas:{" "}
            {summary.completed_appointments}, Pendientes:{" "}
            {summary.pending_appointments})
          </p>
          <p>
            Pagos: <strong>{summary.total_payments}</strong> | Exoneraciones:{" "}
            <strong>{summary.total_waived}</strong> | Eventos:{" "}
            <strong>{summary.total_events}</strong>
          </p>
          <p>
            💰 Balance estimado: <strong>${summary.financial_balance}</strong>{" "}
            (Ingresos: ${summary.total_payments_amount} – Exoneraciones: $
            {summary.estimated_waived_amount})
          </p>
        </div>

        {/* 🔹 Gráficos comparativos */}
        <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
          <div style={{ flex: 1 }}>
            <h3>Citas por estado</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={appointmentsData}>
                <XAxis dataKey="name" stroke={darkMode ? "#f5f5f5" : "#000"} />
                <YAxis stroke={darkMode ? "#f5f5f5" : "#000"} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 1 }}>
            <h3>Pagos vs Exoneraciones</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={financeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {financeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🔹 Tendencia de citas por mes */}
        <div style={{ marginBottom: "2rem" }}>
          <h3>Tendencia de citas por mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={summary.appointments_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#555" : "#ccc"} />
              <XAxis dataKey="month" stroke={darkMode ? "#f5f5f5" : "#000"} />
              <YAxis stroke={darkMode ? "#f5f5f5" : "#000"} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="citas" stroke="#0088FE" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* 🔹 Tendencia de pagos por semana */}
        <div style={{ marginBottom: "2rem" }}>
          <h3>Tendencia de pagos por semana</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={summary.payments_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#555" : "#ccc"} />
              <XAxis dataKey="week" stroke={darkMode ? "#f5f5f5" : "#000"} />
              <YAxis stroke={darkMode ? "#f5f5f5" : "#000"} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="pagos" stroke="#00C49F" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 🔹 Balance financiero por semana */}
        <div style={{ marginBottom: "2rem" }}>
          <h3>Balance financiero por semana</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={summary.balance_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#555" : "#ccc"} />
              <XAxis dataKey="week" stroke={darkMode ? "#f5f5f5" : "#000"} />
              <YAxis stroke={darkMode ? "#f5f5f5" : "#000"} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="balance" stroke="#FF8042" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
