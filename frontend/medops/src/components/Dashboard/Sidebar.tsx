import React from "react";

const Sidebar: React.FC = () => {
  return (
    <aside className="dashboard-sidebar">
      <nav>
        <div className="sidebar-section-title">Módulos</div>
        <ul className="sidebar-nav-list">
          <li className="sidebar-nav-item"><span>📅</span> Citas</li>
          <li className="sidebar-nav-item"><span>👤</span> Pacientes</li>
          <li className="sidebar-nav-item"><span>💳</span> Pagos</li>
          <li className="sidebar-nav-item"><span>📄</span> Reportes</li>
          <li className="sidebar-nav-item"><span>⚠️</span> Alertas</li>
        </ul>

        <div className="sidebar-section-title">Acciones rápidas</div>
        <div className="sidebar-quick-actions">
          <button className="btn btn-primary">Nueva cita</button>
          <button className="btn btn-primary">Registrar pago</button>
          <button className="btn btn-outline">Exportar reporte</button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
