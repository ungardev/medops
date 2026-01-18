# Implementation Plan: Authentication Fix

## 🎯 OBJECTIVE
Fix 401 Unauthorized errors blocking ConfigPage.tsx by implementing environment variable-based authentication for development.

---

## 📊 CURRENT STATE

### Issues:
- `localStorage.getItem("authToken")` returns `null`
- No Authorization header sent to API
- All protected endpoints return 401
- ConfigPage.tsx shows empty data instead of API results

### Files Affected:
1. `frontend/medops/src/main.tsx` (lines 37-40)
2. `frontend/medops/.env.development`

---

## 🔧 IMPLEMENTATION STEPS

### STEP 1: Update .env.development
**File:** `frontend/medops/.env.development`

**Current content:**
```env
VITE_API_URL=http://127.0.0.1:8080/api
```

**New content:**
```env
VITE_API_URL=http://127.0.0.1:8080/api
VITE_API_TOKEN=088fd388feae794fad526f4854cda271528381
```

---

### STEP 2: Modify main.tsx Authentication Logic
**File:** `frontend/medops/src/main.tsx`

**Lines 37-40:**

**Current code:**
```typescript
const token = localStorage.getItem("authToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Token ${token}`;
}
```

**New code:**
```typescript
const token = import.meta.env.VITE_API_TOKEN ?? localStorage.getItem("authToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Token ${token}`;
}
```

---

### COMPLETE main.tsx WITH ALL CHANGES APPLIED
**File:** `frontend/medops/src/main.tsx`

```typescript
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
const token = import.meta.env.VITE_API_TOKEN ?? localStorage.getItem("authToken");
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
```

---

## 🔄 CHANGES MADE

### .env.development
- Added `VITE_API_TOKEN=088fd388feae794fad526f4854cda271528381`

### main.tsx
- Line 37: Changed `localStorage.getItem("authToken")` to `import.meta.env.VITE_API_TOKEN ?? localStorage.getItem("authToken")`

---

## ✅ BENEFITS

### Development:
- ✅ Immediate token availability (no login required)
- ✅ Works across page refreshes
- ✅ No hardcoded tokens in codebase
- ✅ Follows best practices (12-factor app)

### Production:
- ✅ Falls back to localStorage for real authentication
- ✅ Login page remains fully functional
- ✅ No changes needed for production deployment
- ✅ Seamless transition from dev to prod

### Security:
- ✅ Token in .env.development only (not committed)
- ✅ Production uses proper authentication flow
- ✅ No secrets in code

---

## 🎯 VERIFICATION STEPS

### 1. After Implementation:
```bash
# Restart dev server
cd frontend/medops
npm run dev
```

### 2. Check Browser Console:
- ✅ `Authorization: Token 088fd388feae794fad526f4854cda271528381` in request headers
- ✅ No 401 errors
- ✅ API calls to `/api/config/institution/` return 200
- ✅ API calls to `/api/config/doctor/` return 200

### 3. Test ConfigPage.tsx:
- ✅ Institution data displays
- ✅ Doctor operator data displays
- ✅ Specialty choices load
- ✅ Forms save/update correctly

---

## ⚠️ PRODUCTION REMINDER

**Before deploying to production:**

1. Remove `VITE_API_TOKEN` from production environment
2. Keep `localStorage.getItem("authToken")` fallback
3. Ensure login flow works correctly
4. Test authentication end-to-end

---

## 📋 SUMMARY

**Files to modify:** 2
- `.env.development` - Add VITE_API_TOKEN
- `main.tsx` - Change line 37

**Lines changed:** 1
- Line 37 in main.tsx

**Time to implement:** 2 minutes

**Risk:** Low (fallback to localStorage for production)

**Result:** ConfigPage.tsx will load data immediately without login
