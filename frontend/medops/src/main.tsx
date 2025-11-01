// src/main.tsx
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import DashboardSuperUser from "./pages/Dashboard/DashboardSuperUser";
import Patients from "./pages/Patients/Patients";
import PatientDetail from "./pages/Patients/PatientDetail";
import Appointments from "./pages/Appointments/Appointments";
import Payments from "./pages/Payments/Payments";
import Events from "./pages/Events/Events";
import AuditDashboard from "./pages/Dashboard/AuditDashboard";
import WaitingRoom from "./pages/WaitingRoom/WaitingRoom";
import Consultation from "./pages/Consultation/Consultation";
import Login from "./pages/Auth/Login";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Importa el NotifyProvider
import { NotifyProvider } from "./context/NotifyContext";

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
                <Route index element={<DashboardSuperUser />} />
                <Route path="patients" element={<Patients />} />
                <Route path="patients/:id" element={<PatientDetail />} />
                <Route path="waitingroom" element={<WaitingRoom />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="payments" element={<Payments />} />
                <Route path="events" element={<Events />} />
                <Route path="audit-dashboard" element={<AuditDashboard />} />
                <Route path="consultation" element={<Consultation />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </NotifyProvider>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
