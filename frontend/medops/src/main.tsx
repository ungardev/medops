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

// 🚀 React Query
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// Crear cliente de React Query
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Layout principal con Sidebar */}
          <Route path="/" element={<App />}>
            {/* ✅ Dashboard SuperUser como página principal */}
            <Route index element={<DashboardSuperUser />} />

            {/* Módulos */}
            <Route path="patients" element={<Patients />} />
            <Route path="appointments/today" element={<Appointments />} />
            <Route path="payments/summary" element={<Payments />} />
            <Route path="payments/waived" element={<WaivedConsultations />} />
            <Route path="events" element={<Events />} />
            <Route path="audit-dashboard" element={<AuditDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>

      {/* 🔎 Devtools para depuración */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
