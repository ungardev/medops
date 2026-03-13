// src/main.tsx
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import DashboardPage from "./pages/Dashboard";
import Patients from "./pages/Patients/Patients";
import PatientDetail from "./pages/Patients/PatientDetail";
import PatientConsultationDetail from "./pages/Patients/PatientConsultationsDetail";
import Appointments from "./pages/Appointments/Appointments";
import Payments from "./pages/Payments/Payments";
import ChargeOrderDetail from "./pages/Payments/ChargeOrderDetail";
import PendingPayments from "./pages/Payments/PendingPayments";  // 🆕 Import
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
// CAMBIO: Importar ServiceCatalogPage en lugar de BillingCatalogPage
import ServiceCatalogPage from "./pages/Services/ServiceCatalogPage";
// PatientPortal Imports
import PatientLogin from "./pages/PatientPortal/PatientLogin";
import PatientLogout from "./pages/PatientPortal/PatientLogout";
import PatientLayout from "./components/Layout/PatientLayout";
import { PatientDashboard } from "./pages/PatientPortal/PatientDashboard";
import PatientRecord from "./pages/PatientPortal/PatientRecord";
import PatientQueue from "./pages/PatientPortal/PatientQueue";
import PatientSearch from "./pages/PatientPortal/PatientSearch";
import PatientServices from "./pages/PatientPortal/PatientServices"; // 🆕 Import Servicios
import PatientSettings from "./pages/PatientPortal/PatientSettings";
import PatientActivate from "./pages/PatientPortal/PatientActivate";
import PatientAppointments from "./pages/PatientPortal/PatientAppointments";
import PatientPayments from "./pages/PatientPortal/PatientPayments";
import PatientChargeOrderDetail from "./pages/PatientPortal/PatientChargeOrderDetail";
// Axios config
axios.defaults.baseURL = import.meta.env.VITE_API_URL ?? "/api";
const token = import.meta.env.VITE_DEV_TOKEN;
if (token) {
  axios.defaults.headers.common["Authorization"] = `Token ${token}`;
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <NotifyProvider>
        <BrowserRouter>
          <Routes>
            {/* === PUBLIC ROUTES === */}
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            
            {/* === PATIENT PORTAL - PUBLIC === */}
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route path="/patient/logout" element={<PatientLogout />} />
            <Route path="/patient/activate" element={<PatientActivate />} />
            
            {/* === PATIENT PORTAL - PROTECTED === */}
            <Route 
              path="/patient" 
              element={
                <ProtectedRoute allowedRoles={['patient']}>
                  <PatientLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PatientDashboard />} />
              <Route path="record" element={<PatientRecord />} />
              <Route path="appointments" element={<PatientAppointments />} />
              <Route path="queue" element={<PatientQueue />} />
              <Route path="search" element={<PatientSearch />} />
              <Route path="services" element={<PatientServices />} /> {/* 🆕 Ruta Servicios */}
              <Route path="settings" element={<PatientSettings />} />
              <Route path="payments" element={<PatientPayments />} />
              <Route path="payments/:id" element={<PatientChargeOrderDetail />} />
            </Route>
            
            {/* === DOCTOR PORTAL - PROTECTED === */}
            <Route element={<ProtectedRoute allowedRoles={['doctor', 'admin']} />}>
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
                <Route path="payments/pending" element={<PendingPayments />} />  // 🆕 Nueva ruta
                <Route path="payments/:id" element={<ChargeOrderDetail />} />
                {/* CAMBIO: Ruta de servicios en lugar de billing/catalog */}
                <Route path="services" element={<ServiceCatalogPage />} />
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