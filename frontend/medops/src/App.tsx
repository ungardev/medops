import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar modularizado */}
      <Sidebar />

      {/* Área dinámica */}
      <main style={{ flex: 1, padding: "20px", background: "#f8fafc" }}>
        <Outlet />
      </main>
    </div>
  );
}
