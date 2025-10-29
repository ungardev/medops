import { Outlet } from "react-router-dom";
import Sidebar from "./components/Layout/Sidebar";
import "./index.css";

export default function App() {
  return (
    <div className="app-container">
      <Sidebar />

      <main className="app-main">
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
