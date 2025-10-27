import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import DashboardSuperUser from "./pages/DashboardSuperUser";
import Patients from "./pages/Patients";
import Appointments from "./pages/Appointments";
import Payments from "./pages/Payments";
import WaivedConsultations from "./pages/WaivedConsultations";
import Events from "./pages/Events";
import AuditDashboard from "./pages/AuditDashboard";
import WaitingRoom from "./pages/WaitingRoom";
import Consultation from "./pages/Consulta";
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<App />}>
              <Route index element={<DashboardSuperUser />} />
              <Route path="patients" element={<Patients />} />
              <Route path="waitingroom" element={<WaitingRoom />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="payments" element={<Payments />} />
              <Route path="payments/waived" element={<WaivedConsultations />} />
              <Route path="events" element={<Events />} />
              <Route path="audit-dashboard" element={<AuditDashboard />} />
              <Route path="consultation" element={<Consultation />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
