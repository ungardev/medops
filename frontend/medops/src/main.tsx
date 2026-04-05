// src/main.tsx
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
// import DashboardPage from "./pages/Dashboard"; // REMOVIDO: Dashboard antiguo
import Patients from "./pages/Patients/Patients";
import PatientDetail from "./pages/Patients/PatientDetail";
import PatientConsultationDetail from "./pages/Patients/PatientConsultationsDetail";
import Appointments from "./pages/Appointments/Appointments";
import Payments from "./pages/Payments/Payments";
import ChargeOrderDetail from "./pages/Payments/ChargeOrderDetail";
import PendingPayments from "./pages/Payments/PendingPayments";
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
import { AuthProvider } from "./context/AuthContext"; // ✅ NUEVO: Importar AuthProvider
import axios from "axios";
import ReportsPage from "./pages/Reports/ReportsPage";
import ConfigPage from "./pages/Settings/ConfigPage";
import VisualAudit from "./pages/VisualAudit";
import SearchPage from "./pages/Search/Search";
// CAMBIO: Importar ServiceCatalogPage en lugar de BillingCatalogPage
import ServiceCatalogPage from "./pages/Services/ServiceCatalogPage";
// NUEVO: Importar ServiceDetailPage
import ServiceDetailPage from "./pages/Services/ServiceDetailPage";
// PatientPortal Imports
import PatientLogin from "./pages/PatientPortal/PatientLogin";
import PatientLogout from "./pages/PatientPortal/PatientLogout";
import PatientLayout from "./components/Layout/PatientLayout";
import { PatientDashboard } from "./pages/PatientPortal/PatientDashboard";
import PatientRecord from "./pages/PatientPortal/PatientRecord";
import PatientQueue from "./pages/PatientPortal/PatientQueue";
import PatientSearch from "./pages/PatientPortal/PatientSearch";
import PatientServices from "./pages/PatientPortal/PatientServices";
import PatientSettings from "./pages/PatientPortal/PatientSettings";
import PatientActivate from "./pages/PatientPortal/PatientActivate";
import PatientAppointments from "./pages/PatientPortal/PatientAppointments";
import PatientPayments from "./pages/PatientPortal/PatientPayments";
import PatientChargeOrderDetail from "./pages/PatientPortal/PatientChargeOrderDetail";
// Importación CORREGIDA: Añadir DoctorProfile
import DoctorProfile from "./pages/PatientPortal/DoctorProfile";
// NUEVAS IMPORTACIONES: Doctor Dashboard y Manage Services
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import ManageServicesPage from "./pages/Doctor/ManageServicesPage";
import Surgery from "./pages/Surgery/Surgery";
import Hospitalization from "./pages/Hospitalization/Hospitalization";

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
          {/* ✅ Envolver la app con AuthProvider para manejar estado de autenticación globalmente */}
          <AuthProvider>
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
                <Route path="services" element={<PatientServices />} />
                <Route path="doctor/:id" element={<DoctorProfile />} />
                <Route path="settings" element={<PatientSettings />} />
                <Route path="payments" element={<PatientPayments />} />
                <Route path="payments/:id" element={<PatientChargeOrderDetail />} />
                <Route path="charge-orders/:id/pay" element={<PatientChargeOrderDetail />} />
              </Route>
              
              {/* === DOCTOR PORTAL - PROTECTED === */}
              <Route element={<ProtectedRoute allowedRoles={['doctor', 'admin']} />}>
                <Route element={<App />}>
                  {/* Ruta raíz: Redirige a login para el portal elite */}
                  <Route index element={<Navigate to="/login" replace />} />
                  
                  {/* Ruta del Dashboard del Doctor (reemplaza al antiguo index) */}
                  <Route path="doctor" element={<DoctorDashboard />} />
                  
                  {/* Ruta de gestión de servicios/citas */}
                  <Route path="doctor/manage-services" element={<ManageServicesPage />} />
                  
                  {/* Otras rutas existentes */}
                  <Route path="patients" element={<Patients />} />
                  <Route path="patients/:id" element={<PatientDetail />} />
                  <Route
                    path="patients/:patientId/consultations/:appointmentId"
                    element={<PatientConsultationDetail />}
                  />
                  <Route path="waitingroom" element={<WaitingRoom />} />
                  <Route path="appointments" element={<Appointments />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="payments/pending" element={<PendingPayments />} />
                  <Route path="payments/:id" element={<ChargeOrderDetail />} />
                  <Route path="services" element={<ServiceCatalogPage />} />
                  <Route path="services/:id" element={<ServiceDetailPage />} />
                  <Route path="events" element={<Events />} />
                  <Route path="visual-audit" element={<VisualAudit />} />
                  <Route path="consultation" element={<Consultation />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="reports/:id" element={<ReportsPage />} />
                  <Route path="documents/:id" element={<ReportsPage />} />
                  <Route path="settings/config" element={<ConfigPage />} />
                  <Route path="search" element={<SearchPage />} />
                  <Route path="surgery" element={<Surgery />} />
                  <Route path="hospitalization" element={<Hospitalization />} />
                </Route>
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </NotifyProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);