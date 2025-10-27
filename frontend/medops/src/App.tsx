import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import "./index.css"; // 👈 Importamos solo el index.css global

export default function App() {
  return (
    <div className="app-container">
      {/* Sidebar fijo y elegante */}
      <Sidebar />

      {/* Área dinámica de contenido */}
      <main className="app-main">
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}