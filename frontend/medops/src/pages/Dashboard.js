import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
// 🔹 Nuevos imports para filtros elegantes
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { getDashboardSummary } from "../api/dashboard";
import { mockDashboardSummary } from "../mocks/dashboardSummary"; // fallback
export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [darkMode, setDarkMode] = useState(false);
    // Estados para filtros
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [status, setStatus] = useState("");
    const fetchSummary = () => {
        getDashboardSummary(startDate ? startDate.toISOString().split("T")[0] : undefined, endDate ? endDate.toISOString().split("T")[0] : undefined, status || undefined)
            .then(setSummary)
            .catch(() => {
            console.warn("⚠️ Usando datos mock porque el backend no respondió");
            setSummary(mockDashboardSummary);
        });
    };
    useEffect(() => {
        fetchSummary();
    }, []);
    if (!summary)
        return _jsx("p", { children: "Cargando m\u00E9tricas..." });
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
            if (!input)
                return;
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
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
            pdf.save(`dashboard_${new Date().toISOString().split("T")[0]}.pdf`);
        }
        catch (err) {
            console.error("❌ Error al generar PDF:", err);
        }
    };
    return (_jsxs("div", { children: [_jsx("h1", { children: "\uD83D\uDCCA Dashboard Ejecutivo" }), _jsx("button", { onClick: () => setDarkMode(!darkMode), style: {
                    marginBottom: "1rem",
                    padding: "0.5rem 1rem",
                    background: darkMode ? "#444" : "#0088FE",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginRight: "1rem"
                }, children: darkMode ? "☀️ Modo claro" : "🌙 Modo oscuro" }), _jsx("button", { onClick: handleExportPDF, style: {
                    marginBottom: "1rem",
                    padding: "0.5rem 1rem",
                    background: "#00C49F",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                }, children: "\uD83D\uDCC4 Exportar a PDF (Versi\u00F3n Ejecutiva)" }), _jsxs("div", { style: {
                    display: "flex",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                    alignItems: "center"
                }, children: [_jsxs("div", { children: [_jsx("label", { children: "\uD83D\uDCC5 Desde: " }), _jsx(DatePicker, { selected: startDate, onChange: (date) => setStartDate(date), dateFormat: "dd/MM/yyyy", placeholderText: "Selecciona fecha" })] }), _jsxs("div", { children: [_jsx("label", { children: "\uD83D\uDCC5 Hasta: " }), _jsx(DatePicker, { selected: endDate, onChange: (date) => setEndDate(date), dateFormat: "dd/MM/yyyy", placeholderText: "Selecciona fecha" })] }), _jsxs("div", { style: { minWidth: "200px" }, children: [_jsx("label", { children: "\uD83D\uDCCC Estado: " }), _jsx(Select, { options: [
                                    { value: "", label: "Todos" },
                                    { value: "completed", label: "Completadas" },
                                    { value: "pending", label: "Pendientes" },
                                    { value: "cancelled", label: "Canceladas" },
                                ], value: [
                                    { value: "", label: "Todos" },
                                    { value: "completed", label: "Completadas" },
                                    { value: "pending", label: "Pendientes" },
                                    { value: "cancelled", label: "Canceladas" },
                                ].find((opt) => opt.value === status), onChange: (opt) => setStatus(opt?.value || "") })] }), _jsx("button", { onClick: fetchSummary, style: {
                            padding: "0.5rem 1rem",
                            background: "#0088FE",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                        }, children: "Aplicar filtros" })] }), _jsxs("div", { id: "dashboard-content", style: {
                    background: darkMode ? "#1e1e1e" : "#fff",
                    color: darkMode ? "#f5f5f5" : "#000",
                    padding: "1rem",
                    borderRadius: "8px"
                }, children: [_jsxs("div", { style: {
                            background: darkMode ? "#2a2a2a" : "#f4f6f8",
                            border: darkMode ? "1px solid #555" : "1px solid #ccc",
                            padding: "1rem",
                            marginBottom: "2rem",
                            borderRadius: "6px"
                        }, children: [_jsx("h2", { children: "Resumen Ejecutivo" }), _jsxs("p", { children: ["Pacientes totales: ", _jsx("strong", { children: summary.total_patients }), " | Citas:", " ", _jsx("strong", { children: summary.total_appointments }), " (Completadas:", " ", summary.completed_appointments, ", Pendientes:", " ", summary.pending_appointments, ")"] }), _jsxs("p", { children: ["Pagos: ", _jsx("strong", { children: summary.total_payments }), " | Exoneraciones:", " ", _jsx("strong", { children: summary.total_waived }), " | Eventos:", " ", _jsx("strong", { children: summary.total_events })] }), _jsxs("p", { children: ["\uD83D\uDCB0 Balance estimado: ", _jsxs("strong", { children: ["$", summary.financial_balance] }), " ", "(Ingresos: $", summary.total_payments_amount, " \u2013 Exoneraciones: $", summary.estimated_waived_amount, ")"] })] }), _jsxs("div", { style: { display: "flex", gap: "2rem", marginBottom: "2rem" }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsx("h3", { children: "Citas por estado" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: appointmentsData, children: [_jsx(XAxis, { dataKey: "name", stroke: darkMode ? "#f5f5f5" : "#000" }), _jsx(YAxis, { stroke: darkMode ? "#f5f5f5" : "#000" }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "value", fill: "#0088FE" })] }) })] }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("h3", { children: "Pagos vs Exoneraciones" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: financeData, dataKey: "value", nameKey: "name", cx: "50%", cy: "50%", outerRadius: 100, label: true, children: financeData.map((entry, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, {}), _jsx(Legend, {})] }) })] })] }), _jsxs("div", { style: { marginBottom: "2rem" }, children: [_jsx("h3", { children: "Tendencia de citas por mes" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: summary.appointments_trend, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: darkMode ? "#555" : "#ccc" }), _jsx(XAxis, { dataKey: "month", stroke: darkMode ? "#f5f5f5" : "#000" }), _jsx(YAxis, { stroke: darkMode ? "#f5f5f5" : "#000" }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "citas", stroke: "#0088FE" })] }) })] }), _jsxs("div", { style: { marginBottom: "2rem" }, children: [_jsx("h3", { children: "Tendencia de pagos por semana" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: summary.payments_trend, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: darkMode ? "#555" : "#ccc" }), _jsx(XAxis, { dataKey: "week", stroke: darkMode ? "#f5f5f5" : "#000" }), _jsx(YAxis, { stroke: darkMode ? "#f5f5f5" : "#000" }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "pagos", stroke: "#00C49F" })] }) })] }), _jsxs("div", { style: { marginBottom: "2rem" }, children: [_jsx("h3", { children: "Balance financiero por semana" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: summary.balance_trend, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: darkMode ? "#555" : "#ccc" }), _jsx(XAxis, { dataKey: "week", stroke: darkMode ? "#f5f5f5" : "#000" }), _jsx(YAxis, { stroke: darkMode ? "#f5f5f5" : "#000" }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "balance", stroke: "#FF8042" })] }) })] })] })] }));
}
