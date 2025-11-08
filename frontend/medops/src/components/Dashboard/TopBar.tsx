import React from "react";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { useInstitutionSettings } from "@/hooks/settings/useInstitutionSettings";

const TopBar: React.FC = () => {
  const { data: doctor, isLoading: loadingDoctor } = useDoctorConfig();
  const { data: institution, isLoading: loadingInstitution } = useInstitutionSettings();

  if (loadingDoctor || loadingInstitution) {
    return <header className="dashboard-topbar"><p>Cargando encabezado...</p></header>;
  }

  if (!doctor || !institution) {
    return <header className="dashboard-topbar"><p>No se pudo cargar la configuración.</p></header>;
  }

  // 🔹 Generar iniciales del médico (ej. "Ungar Villamizar" → "UV")
  const initials = doctor.full_name
    ? doctor.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "DR";

  return (
    <header className="dashboard-topbar">
      {/* Branding institucional */}
      <div className="topbar-brand">
        <span className="topbar-logo-dot"></span>
        <div>
          <span className="topbar-brand-name">{institution.name}</span>
          <span className="topbar-brand-sub">
            {institution.address} • Tel: {institution.phone}
          </span>
        </div>
      </div>

      {/* Estado del sistema */}
      <div className="topbar-system-status">
        <span className="topbar-status-dot"></span>
        <span>Sistema en línea</span>
      </div>

      {/* Bloque de usuario */}
      <div className="topbar-user-block">
        <div className="topbar-user-avatar">{initials}</div>
        <div className="topbar-user-info">
          <span className="topbar-user-name">{doctor.full_name}</span>
          {doctor.specialty && (
            <span className="topbar-user-role">{doctor.specialty}</span>
          )}
          <span className="topbar-user-role">{doctor.email}</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
