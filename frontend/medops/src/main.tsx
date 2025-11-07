// src/main.tsx
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import DashboardPage from "./pages/Dashboard"; // 👈 nuevo Dashboard
import Patients from "./pages/Patients/Patients";
import PatientDetail from "./pages/Patients/PatientDetail";
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

// 👇 nuevo import para Reportes
import ReportsPage from "./pages/Reports/ReportsPage";

// 👇 nuevo import para Configuración Institucional
import InstitutionSettingsPage from "./pages/Settings/InstitutionSettingsPage";

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
                {/* 👇 Nuevo Dashboard en la raíz */}
                <Route index element={<DashboardPage />} />

                <Route path="patients" element={<Patients />} />
                <Route path="patients/:id" element={<PatientDetail />} />
                <Route path="waitingroom" element={<WaitingRoom />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="payments" element={<Payments />} />
                <Route path="charge-orders/:id" element={<ChargeOrderDetail />} />
                <Route path="events" element={<Events />} />
                <Route path="audit-dashboard" element={<AuditDashboard />} />
                <Route path="consultation" element={<Consultation />} />

                {/* 👇 Nueva ruta de Reportes */}
                <Route path="reports" element={<ReportsPage />} />

                {/* 👇 Nueva ruta de Configuración Institucional */}
                <Route path="settings/institution" element={<InstitutionSettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </NotifyProvider>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
