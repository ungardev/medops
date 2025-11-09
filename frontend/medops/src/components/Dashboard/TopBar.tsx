import React, { useEffect, useState } from "react";
import { useDoctorConfig } from "@/hooks/settings/useDoctorConfig";
import { useInstitutionSettings } from "@/hooks/settings/useInstitutionSettings";
import { useQuery } from "@tanstack/react-query";

type BCVRate = {
  source: string;
  date: string;
  value: number;
  unit: string;
  precision: number;
  is_fallback: boolean;
};

async function fetchBCVRate(): Promise<BCVRate> {
  const resp = await fetch("/api/bcv-rate/");
  if (!resp.ok) throw new Error("Error al cargar tasa BCV");
  return resp.json();
}

const TopBar: React.FC = () => {
  const { data: doctor, isLoading: loadingDoctor } = useDoctorConfig();
  const { data: institution, isLoading: loadingInstitution } = useInstitutionSettings();
  const { data: bcvRate } = useQuery<BCVRate>({
    queryKey: ["bcv-rate"],
    queryFn: fetchBCVRate,
    staleTime: 60_000,
  });

  const [dateTime, setDateTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (loadingDoctor || loadingInstitution) {
    return <header className="dashboard-topbar"><p>Cargando encabezado...</p></header>;
  }

  if (!doctor || !institution) {
    return <header className="dashboard-topbar"><p>No se pudo cargar la configuración.</p></header>;
  }

  const initials = doctor.full_name
    ? doctor.full_name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "DR";

  const formattedDate = dateTime.toLocaleDateString("es-VE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = dateTime.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="dashboard-topbar">
      <div className="topbar-brand">
        <span className="topbar-logo-dot"></span>
        <div>
          <span className="topbar-brand-name">{institution.name}</span>
          <span className="topbar-brand-sub">
            {formattedDate} • {formattedTime}
          </span>
        </div>
      </div>

      <div className="topbar-system-status">
        <span className="topbar-status-dot"></span>
        <span>Sistema en línea</span>
        {bcvRate && (
          <span className="badge badge-info ml-2">
            USD/VEF: {bcvRate.value.toFixed(2)}
          </span>
        )}
      </div>

      <div className="topbar-user-block">
        <div className="topbar-user-avatar">{initials}</div>
        <div className="topbar-user-info">
          <span className="topbar-user-name">{doctor.full_name}</span>
          {doctor.specialty && <span className="topbar-user-role">{doctor.specialty}</span>}
          <span className="topbar-user-role">{doctor.email}</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
