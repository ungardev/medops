// src/main.tsx
import "./index.css";
import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient, initQueryPersistence } from "@/lib/reactQuery";
import { NotifyProvider } from "./context/NotifyContext";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import axios from "axios";
import * as Sentry from "@sentry/react";
import { getCurrentPortal, getPortalConfig } from "@/lib/subdomain";

// Initialize query cache persistence
initQueryPersistence();

// Axios config
axios.defaults.baseURL = import.meta.env.VITE_API_URL ?? "/api";

// Sentry initialization
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.MODE,
});

// Sentry Error Boundary Fallback
const SentryErrorFallback = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-8">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.66 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Algo salió mal</h2>
      <p className="text-white/60 mb-6">Encontramos un error inesperado. Nuestro equipo ha sido notificado.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors"
      >
        Recargar página
      </button>
    </div>
  </div>
);

// Lazy-loaded pages (Priority 1 - heavy routes)
const DoctorDashboard = lazy(() => import("./pages/Doctor/DoctorDashboard"));
const Patients = lazy(() => import("./pages/Patients/Patients"));
const PatientDetail = lazy(() => import("./pages/Patients/PatientDetail"));
const Appointments = lazy(() => import("./pages/Appointments/Appointments"));
const Consultation = lazy(() => import("./pages/Consultation/Consultation"));
const WaitingRoom = lazy(() => import("./pages/WaitingRoom/WaitingRoom"));

// Lazy-loaded pages (Priority 2 - secondary routes)
const ManageServicesPage = lazy(() => import("./pages/Doctor/ManageServicesPage"));
const PatientConsultationDetail = lazy(() => import("./pages/Patients/PatientConsultationsDetail"));
const Payments = lazy(() => import("./pages/Payments/Payments"));
const ChargeOrderDetail = lazy(() => import("./pages/Payments/ChargeOrderDetail"));
const PendingPayments = lazy(() => import("./pages/Payments/PendingPayments"));
const ServiceCatalogPage = lazy(() => import("./pages/Services/ServiceCatalogPage"));
const ServiceDetailPage = lazy(() => import("./pages/Services/ServiceDetailPage"));
const Surgery = lazy(() => import("./pages/Surgery/Surgery"));
const Hospitalization = lazy(() => import("./pages/Hospitalization/Hospitalization"));
const ReportsPage = lazy(() => import("./pages/Reports/ReportsPage"));
const ConfigPage = lazy(() => import("./pages/Settings/ConfigPage"));
const SearchPage = lazy(() => import("./pages/Search/Search"));
const Diagnosis = lazy(() => import("./pages/Diagnosis/Diagnosis"));

// Eager-loaded pages (public/lightweight)
import Login from "./pages/Auth/Login";
import Logout from "./pages/Auth/Logout";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";

// Patient Portal Imports
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
import DoctorProfile from "./pages/PatientPortal/DoctorProfile";
import PatientSurgery from "./pages/PatientPortal/PatientSurgery";
import PatientHospitalization from "./pages/PatientPortal/PatientHospitalization";

// Doctor Portal Imports
import DoctorActivate from "./pages/DoctorPortal/DoctorActivate";

// Admin Portal Imports
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminLogin from "./pages/Admin/Login";
import AdminOverview from "./pages/Admin/AdminOverview";
import BancaribeConfig from "./pages/Admin/BancaribeConfig";
import DoctorsList from "./pages/Admin/DoctorsList";
import DisbursementsAdmin from "./pages/Admin/DisbursementsAdmin";
import PlatformEarnings from "./pages/Admin/PlatformEarnings";
import InstitutionsAdmin from "./pages/Admin/InstitutionsAdmin";

// Subdomain-aware root redirect component
const SubdomainRootRedirect: React.FC = () => {
  const portal = getCurrentPortal();
  const config = getPortalConfig(portal);
  return <Navigate to={config.loginPath} replace />;
};

// Page skeleton loader
const PageSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-32 bg-white/5 rounded-lg" />
    <div className="h-24 bg-white/5 rounded-lg" />
    <div className="h-48 bg-white/5 rounded-lg" />
  </div>
);

// Lazy route wrapper with Suspense
const LazyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <NotifyProvider>
        <BrowserRouter>
          <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>
            <AuthProvider>
              <Routes>
                {/* PUBLIC ROOT: Subdomain-aware redirect */}
                <Route path="/" element={<SubdomainRootRedirect />} />

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
                    <ProtectedRoute allowedRoles={["patient"]}>
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
                  <Route path="surgery" element={<PatientSurgery />} />
                  <Route path="hospitalization" element={<PatientHospitalization />} />
                </Route>

                {/* === DOCTOR PORTAL - PUBLIC === */}
                <Route path="/doctor/activate" element={<DoctorActivate />} />

                {/* === DOCTOR PORTAL - PROTECTED === */}
                <Route element={<ProtectedRoute allowedRoles={["doctor", "admin"]} />}>
                  <Route element={<App />}>
                    {/* Priority 1 routes - Lazy loaded */}
                    <Route
                      path="doctor"
                      element={<LazyRoute><DoctorDashboard /></LazyRoute>}
                    />
                    <Route
                      path="patients"
                      element={<LazyRoute><Patients /></LazyRoute>}
                    />
                    <Route
                      path="patients/:id"
                      element={<LazyRoute><PatientDetail /></LazyRoute>}
                    />
                    <Route
                      path="patients/:patientId/consultations/:appointmentId"
                      element={<LazyRoute><PatientConsultationDetail /></LazyRoute>}
                    />
                    <Route
                      path="waitingroom"
                      element={<LazyRoute><WaitingRoom /></LazyRoute>}
                    />
                    <Route
                      path="appointments"
                      element={<LazyRoute><Appointments /></LazyRoute>}
                    />
                    <Route
                      path="consultation"
                      element={<LazyRoute><Consultation /></LazyRoute>}
                    />

                    {/* Priority 2 routes - Lazy loaded */}
                    <Route
                      path="doctor/manage-services"
                      element={<LazyRoute><ManageServicesPage /></LazyRoute>}
                    />
                    <Route
                      path="payments"
                      element={<LazyRoute><Payments /></LazyRoute>}
                    />
                    <Route
                      path="payments/pending"
                      element={<LazyRoute><PendingPayments /></LazyRoute>}
                    />
                    <Route
                      path="payments/:id"
                      element={<LazyRoute><ChargeOrderDetail /></LazyRoute>}
                    />
                    <Route
                      path="services"
                      element={<LazyRoute><ServiceCatalogPage /></LazyRoute>}
                    />
                    <Route
                      path="services/:id"
                      element={<LazyRoute><ServiceDetailPage /></LazyRoute>}
                    />
                    <Route
                      path="surgery"
                      element={<LazyRoute><Surgery /></LazyRoute>}
                    />
                    <Route
                      path="hospitalization"
                      element={<LazyRoute><Hospitalization /></LazyRoute>}
                    />
                    <Route
                      path="reports"
                      element={<LazyRoute><ReportsPage /></LazyRoute>}
                    />
                    <Route
                      path="reports/:id"
                      element={<LazyRoute><ReportsPage /></LazyRoute>}
                    />
                    <Route
                      path="documents/:id"
                      element={<LazyRoute><ReportsPage /></LazyRoute>}
                    />
                    <Route
                      path="settings/config"
                      element={<LazyRoute><ConfigPage /></LazyRoute>}
                    />
                    <Route
                      path="search"
                      element={<LazyRoute><SearchPage /></LazyRoute>}
                    />
                    <Route
                      path="diagnosis"
                      element={<LazyRoute><Diagnosis /></LazyRoute>}
                    />
                  </Route>
                </Route>

                {/* === ADMIN PORTAL === */}
                <Route path="admin/login" element={<AdminLogin />} />
                <Route
                  path="admin"
                  element={
                    <AdminAuthProvider>
                      <AdminLayout />
                    </AdminAuthProvider>
                  }
                >
                  <Route index element={<AdminOverview />} />
                  <Route path="bancaribe" element={<BancaribeConfig />} />
                  <Route path="doctors" element={<DoctorsList />} />
                  <Route path="disbursements" element={<DisbursementsAdmin />} />
                  <Route path="earnings" element={<PlatformEarnings />} />
                  <Route path="institutions" element={<InstitutionsAdmin />} />
                </Route>
              </Routes>
            </AuthProvider>
          </Sentry.ErrorBoundary>
        </BrowserRouter>
      </NotifyProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);