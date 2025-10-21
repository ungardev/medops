import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import {
  mockPatients,
  mockAppointments,
  mockPayments,
  mockEvents,
  mockWaivedConsultations,
} from "../mocks/mockData";

// 🔑 Función auxiliar para calcular la semana del año
function getWeekKey(dateStr: string) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const dayOfYear = Math.floor((d.getTime() - oneJan.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const week = Math.ceil(dayOfYear / 7);
  return `${year}-W${week}`;
}

// 🔑 Función para filtrar por rango de fechas
function filterByDateRange<T extends { date: string }>(data: T[], start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return data.filter((item) => {
    const d = new Date(item.date);
    return d >= startDate && d <= endDate;
  });
}

export default function Dashboard() {
  const today = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState(today);

  // 🔹 Estados de filtro
  const [selectedPatient, setSelectedPatient] = useState<number | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "completed" | "pending" | "cancelled">("all");

  // 🔹 Estado de tema
  const [darkMode, setDarkMode] = useState(false);

  // Datos base
  const patients = mockPatients;
  let appointments = filterByDateRange(mockAppointments, startDate, endDate);
  let payments = filterByDateRange(mockPayments, startDate, endDate);
  let events = filterByDateRange(mockEvents, startDate, endDate);
  let waived = filterByDateRange(mockWaivedConsultations, startDate, endDate);

  // 🔹 Filtrar por paciente
  if (selectedPatient !== "all") {
    appointments = appointments.filter((a: any) => a.patientId === selectedPatient);
    payments = payments.filter((p: any) => p.patientId === selectedPatient);
    waived = waived.filter((w: any) => w.patientId === selectedPatient);
  }

  // 🔹 Filtrar por estado de cita
  if (selectedStatus !== "all") {
    appointments = appointments.filter((a: any) => a.status === selectedStatus);
  }

  // Métricas simples
  const totalPatients = patients.length;
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter((a: any) => a.status === "completed").length;
  const pendingAppointments = appointments.filter((a: any) => a.status === "pending").length;
  const totalPayments = payments.length;
  const totalEvents = events.length;
  const totalWaived = waived.length;

  // Balance financiero total
  const totalPaymentsAmount = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const estimatedWaivedAmount = waived.length * 50; // 💡 Ajusta el valor unitario
  const financialBalance = totalPaymentsAmount - estimatedWaivedAmount;

  // Datos para gráficos (tipados)
  const appointmentsData: { name: string; value: number }[] = [
    { name: "Completadas", value: completedAppointments },
    { name: "Pendientes", value: pendingAppointments },
  ];

  const financeData: { name: string; value: number }[] = [
    { name: "Pagos", value: totalPayments },
    { name: "Exoneradas", value: totalWaived },
  ];

  // Tendencias
  const appointmentsByMonth = appointments.reduce((acc: any, a: any) => {
    const month = new Date(a.date).toLocaleString("es-VE", { month: "short", year: "numeric" });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});
  const appointmentsTrend = Object.entries(appointmentsByMonth).map(([month, count]) => ({
    month,
    citas: count as number,
  }));

  const paymentsByWeek = payments.reduce((acc: any, p: any) => {
    const weekKey = getWeekKey(p.date);
    acc[weekKey] = (acc[weekKey] || 0) + (p.amount || 0);
    return acc;
  }, {});

  const waivedByWeek = waived.reduce((acc: any, w: any) => {
    const weekKey = getWeekKey(w.date);
    acc[weekKey] = (acc[weekKey] || 0) + 50;
    return acc;
  }, {});

  const balanceByWeek: any[] = [];
  const allWeeks = new Set([...Object.keys(paymentsByWeek), ...Object.keys(waivedByWeek)]);
  allWeeks.forEach((week) => {
    const pagos = paymentsByWeek[week] || 0;
    const exoneraciones = waivedByWeek[week] || 0;
    balanceByWeek.push({ week, balance: pagos - exoneraciones });
  });

  const paymentsTrend = Object.entries(paymentsByWeek).map(([week, amount]) => ({
    week,
    pagos: amount as number,
  }));

  const COLORS = ["#0088FE", "#FF8042", "#00C49F", "#FFBB28"];

  // 🔹 Exportación a PDF optimizada con portada blanca y logo proporcionado
    const handleExportPDF = async () => {
    try {
        const input = document.getElementById("dashboard-content");
        if (!input) {
        console.error("❌ No se encontró el contenedor #dashboard-content");
        return;
        }

        // Captura del dashboard con escala reducida
        const canvas = await html2canvas(input, { scale: 1 });
        // Exportar como JPEG con compresión al 70%
        const imgData = canvas.toDataURL("image/jpeg", 0.7);

        const pdf = new jsPDF("p", "mm", "a4");

        // Portada ejecutiva en blanco
        pdf.setFillColor("#FFFFFF");
        pdf.rect(0, 0, 210, 297, "F");
        pdf.setTextColor("#000000"); // texto en negro
        pdf.setFontSize(22);
        pdf.text("Reporte Ejecutivo - MedOps", 20, 50);
        pdf.setFontSize(14);
        pdf.text(`Generado: ${new Date().toLocaleDateString()}`, 20, 70);

        // Logo corporativo (opcional, mantiene proporción)
        try {
        const logo = new Image();
        logo.src = "/logo.png"; // debe estar en /public
        await new Promise((resolve) => {
            logo.onload = () => {
            const aspectRatio = logo.width / logo.height;
            const logoWidth = 40; // ancho en mm
            const logoHeight = logoWidth / aspectRatio; // alto proporcional
            pdf.addImage(logo, "PNG", 150, 20, logoWidth, logoHeight);
            resolve(true);
            };
            logo.onerror = () => {
            console.warn("⚠️ No se pudo cargar el logo, se omite.");
            resolve(true);
            };
        });
        } catch (e) {
        console.warn("⚠️ Error cargando logo:", e);
        }

        // Página 2: Dashboard completo
        pdf.addPage();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

        // Página 3: Tabla de métricas clave
        pdf.addPage();
        pdf.setFontSize(18);
        pdf.setTextColor("#000000");
        pdf.text("Resumen de Métricas Clave", 20, 30);
        pdf.setFontSize(12);

        const metrics = [
        ["Pacientes", totalPatients],
        ["Citas totales", totalAppointments],
        ["Citas completadas", completedAppointments],
        ["Citas pendientes", pendingAppointments],
        ["Eventos", totalEvents],
        ["Pagos", totalPayments],
        ["Exoneraciones", totalWaived],
        ["Ingresos ($)", totalPaymentsAmount],
        ["Exoneraciones ($)", estimatedWaivedAmount],
        ["Balance ($)", financialBalance],
        ];

        let y = 50;
        metrics.forEach(([label, value]) => {
        pdf.text(`${label}: ${value}`, 20, y);
        y += 8;
        });

        // Guardar PDF comprimido
        pdf.save(`dashboard_${new Date().toISOString().split("T")[0]}.pdf`);
        console.log("✅ PDF generado correctamente con portada blanca y logo proporcionado");
    } catch (err) {
        console.error("❌ Error al generar PDF:", err);
    }
    };




  return (
    <div>
      <h1>📊 Dashboard Ejecutivo con Filtros Combinados</h1>

      {/* Botón de alternar tema */}
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

      {/* Botón de exportación */}
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

      {/* Contenedor del dashboard */}
      <div
        id="dashboard-content"
        style={{
          background: darkMode ? "#1e1e1e" : "#fff",
          color: darkMode ? "#f5f5f5" : "#000",
          padding: "1rem",
          borderRadius: "8px"
        }}
      >
        {/* 🔹 Resumen ejecutivo dinámico */}
        <div style={{
          background: darkMode ? "#2a2a2a" : "#f4f6f8",
          border: darkMode ? "1px solid #555" : "1px solid #ccc",
          padding: "1rem",
          marginBottom: "2rem",
          borderRadius: "6px"
        }}>
          <h2>Resumen Ejecutivo</h2>
          <p>
            En el rango <strong>{startDate}</strong> a <strong>{endDate}</strong>,{" "}
            {selectedPatient === "all" ? "todos los pacientes" : patients.find(p => p.id === selectedPatient)?.name}{" "}
            tuvieron <strong>{totalAppointments}</strong> citas
            {selectedStatus !== "all" ? ` (${selectedStatus})` : ""}, con{" "}
            <strong>{completedAppointments}</strong> completadas y{" "}
            <strong>{pendingAppointments}</strong> pendientes. Se registraron{" "}
            <strong>{totalPayments}</strong> pagos y{" "}
            <strong>{totalWaived}</strong> exoneraciones.
          </p>
          <p>
            💰 Balance estimado: <strong>${financialBalance}</strong> 
            (Ingresos: ${totalPaymentsAmount} – Exoneraciones: ${estimatedWaivedAmount})
          </p>
        </div>

        {/* Métricas rápidas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { title: "Pacientes", value: totalPatients },
            { title: "Citas", value: totalAppointments, extra: [`Completadas: ${completedAppointments}`, `Pendientes: ${pendingAppointments}`] },
            { title: "Eventos", value: totalEvents },
            { title: "Pagos", value: totalPayments },
            { title: "Exoneraciones", value: totalWaived }
          ].map((metric, idx) => (
            <div
              key={idx}
              style={{
                border: darkMode ? "1px solid #555" : "1px solid #ccc",
                background: darkMode ? "#2a2a2a" : "#fff",
                padding: "1rem",
                borderRadius: "6px"
              }}
            >
              <h2>{metric.title}</h2>
              <p>Total: {metric.value}</p>
              {metric.extra && metric.extra.map((line, i) => <p key={i}>{line}</p>)}
            </div>
          ))}
        </div>

        {/* Gráficos comparativos */}
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
                  {financeData.map((entry: { name: string; value: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tendencias temporales */}
        <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
          <div style={{ flex: 1 }}>
            <h3>Tendencia de citas por mes</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={appointmentsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#555" : "#ccc"} />
                <XAxis dataKey="month" stroke={darkMode ? "#f5f5f5" : "#000"} />
                <YAxis stroke={darkMode ? "#f5f5f5" : "#000"} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="citas" stroke="#0088FE" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 1 }}>
            <h3>Tendencia de pagos por semana</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={paymentsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#555" : "#ccc"} />
                <XAxis dataKey="week" stroke={darkMode ? "#f5f5f5" : "#000"} />
                <YAxis stroke={darkMode ? "#f5f5f5" : "#000"} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pagos" stroke="#00C49F" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🔹 Balance financiero por semana */}
        <div style={{ marginTop: "2rem" }}>
          <h3>Balance financiero por semana</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={balanceByWeek}>
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
