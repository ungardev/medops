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
import WaitingRoom from "./pages/WaitingRoom/WaitingRoom";
import Consultation from "./pages/Consultation/Consultation";
import Login from "./pages/Auth/Login";
import Logout from "./pages/Auth/Logout";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/reactQuery";
import { NotifyProvider } from "./context/NotifyContext";
import axios from "axios";
import ReportsPage from "./pages/Reports/ReportsPage";
import ConfigPage from "./pages/Settings/ConfigPage";
import VisualAudit from "./pages/VisualAudit";
import SearchPage from "./pages/Search/Search";
// 🔹 Configuración global de axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL ?? "/api";
const token = import.meta.env.VITE_DEV_TOKEN ?? localStorage.getItem("authToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Token ${token}`;
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <NotifyProvider>
        <BrowserRouter>
          <Routes>
            {/* 🔹 Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            {/* 🔹 Rutas protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route element={<App />}>
                <Route index element={<DashboardPage />} />
                <Route path="patients" element={<Patients />} />
                <Route path="patients/:id" element={<PatientDetail />} />
                <Route
                  path="patients/:patientId/consultations/:appointmentId"
                  element={<PatientConsultationDetail />}
                />
                <Route path="waitingroom" element={<WaitingRoom />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="payments" element={<Payments />} />
                <Route path="payments/:id" element={<Payments />} />
                <Route path="charge-orders/:id" element={<ChargeOrderDetail />} />
                <Route path="events" element={<Events />} />
                <Route path="visual-audit" element={<VisualAudit />} />
                <Route path="consultation" element={<Consultation />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="reports/:id" element={<ReportsPage />} />
                <Route path="documents/:id" element={<ReportsPage />} />
                <Route path="settings/config" element={<ConfigPage />} />
                <Route path="search" element={<SearchPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </NotifyProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);