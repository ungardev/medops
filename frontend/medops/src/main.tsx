// src/main.tsx
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import DashboardPage from "./pages/Dashboard";
import Patients from "./pages/Patients/Patients";
import PatientDetail from "./pages/Patients/PatientDetail";
import PatientConsultationDetail from "./pages/Patients/PatientConsultationsDetail"; 
import Appointments from "./pages/Appointments/Appointments";
import Payments from "./pages/Payments/Payments";
import ChargeOrderDetail from "./pages/Payments/ChargeOrderDetail";
import Events from "./pages/Events/Events";
import AuditDashboard from "./pages/Dashboard/AuditDashboard";
import WaitingRoom from "./pages/WaitingRoom/WaitingRoom";
import Consultation from "./pages/Consultation/Consultation";
import Login from "./pages/Auth/Login";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { NotifyProvider } from "./context/NotifyContext";

import axios from "axios";

import ReportsPage from "./pages/Reports/ReportsPage";
import ConfigPage from "./pages/Settings/ConfigPage";
import VisualAudit from "./pages/VisualAudit"; 
import SearchPage from "./pages/Search/Search"; // 👈 NUEVO IMPORT

// Configuración global de axios usando Vite env
axios.defaults.baseURL = import.meta.env.VITE_API_URL ?? "/api";
const token = localStorage.getItem("authToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Token ${token}`;
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <NotifyProvider>
        <BrowserRouter>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />

            {/* Rutas protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route element={<App />}>
                <Route index element={<DashboardPage />} />

                <Route path="patients" element={<Patients />} />
                <Route path="patients/:id" element={<PatientDetail />} />
                <Route
                  path="patients/:patientId/consultations/:appointmentId"
                  element={<PatientConsultationDetail />}
                />

                {/* Sala de espera */}
                <Route path="waitingroom" element={<WaitingRoom />} /> {/* 🔹 solo general */}

                {/* Citas */}
                <Route path="appointments" element={<Appointments />} />

                {/* Pagos */}
                <Route path="payments" element={<Payments />} />
                <Route path="payments/:id" element={<Payments />} /> {/* 🔹 dinámica */}
                <Route path="charge-orders/:id" element={<ChargeOrderDetail />} />

                {/* Eventos */}
                <Route path="events" element={<Events />} />

                {/* Auditoría */}
                <Route path="audit-dashboard" element={<AuditDashboard />} />
                <Route path="visual-audit" element={<VisualAudit />} />

                {/* Consulta */}
                <Route path="consultation" element={<Consultation />} />

                {/* Reportes */}
                <Route path="reports" element={<ReportsPage />} />
                <Route path="reports/:id" element={<ReportsPage />} /> {/* 🔹 dinámica */}
                <Route path="documents/:id" element={<ReportsPage />} /> {/* 🔹 opcional */}

                {/* Configuración */}
                <Route path="settings/config" element={<ConfigPage />} />

                {/* Búsqueda */}
                <Route path="search" element={<SearchPage />} /> {/* 👈 FIX */}
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </NotifyProvider>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
