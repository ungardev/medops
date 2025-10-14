import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import App from "./App"
import Dashboard from "./pages/Dashboard"
import Patients from "./pages/Patients"
import Appointments from "./pages/Appointments"
import Payments from "./pages/Payments"
import WaivedConsultations from "./pages/WaivedConsultations"
import Events from "./pages/Events"
import AuditDashboard from "./pages/AuditDashboard"

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />}>
                    <Route index element={<Dashboard />} />
                    <Route path="patients" element={<Patients />} />
                    <Route path="appointments/today" element={<Appointments />} />
                    <Route path="payments/summary" element={<Payments />} />
                    <Route path="payments/waived" element={<WaivedConsultations />} />
                    <Route path="events" element={<Events />} />
                    <Route path="audit-dashboard" element={<AuditDashboard />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
)
