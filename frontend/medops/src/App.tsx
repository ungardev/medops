import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";

export default function App() {
  return (
    <div className="app-container">
      {/* Sidebar modularizado */}
      <Sidebar />

      {/* Área dinámica */}
      <main className="app-main">
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
