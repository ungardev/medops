// src/pages/Dashboard/index.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  UsersIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
// Importar componentes del dashboard si es necesario
// import StatCard from "@/components/Dashboard/StatCard";
// import RecentActivity from "@/components/Dashboard/RecentActivity";
export default function Dashboard() {
  const navigate = useNavigate();
  
  // Datos de ejemplo para las tarjetas estadísticas
  const stats = [
    { 
      title: "Pacientes Activos", 
      value: "1,245", 
      change: "+12%", 
      icon: UsersIcon, 
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    { 
      title: "Citas Hoy", 
      value: "42", 
      change: "+8%", 
      icon: CalendarIcon, 
      color: "text-emerald-400",
      bg: "bg-emerald-400/10"
    },
    { 
      title: "Ingresos del Día", 
      value: "$3,450", 
      change: "+5%", 
      icon: CurrencyDollarIcon, 
      color: "text-amber-400",
      bg: "bg-amber-400/10"
    },
    { 
      title: "En Espera", 
      value: "8", 
      change: "Activo", 
      icon: ClockIcon, 
      color: "text-purple-400",
      bg: "bg-purple-400/10"
    }
  ];
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      {/* 
        NOTA: El PageHeader ha sido eliminado según la solicitud.
        Los widgets ahora subirán naturalmente en el layout.
      */}
      
      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index}
            className="bg-[#0a0a0b] border border-white/5 rounded-sm p-6 hover:border-white/10 transition-colors group cursor-pointer"
            onClick={() => stat.title === "Citas Hoy" && navigate("/appointments")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-sm ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className={`text-xs font-bold ${stat.color}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-xs text-white/40 uppercase tracking-wider">{stat.title}</p>
          </div>
        ))}
      </div>
      {/* Sección de Actividad Reciente y Gráficos (Ejemplo) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a0a0b] border border-white/5 rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Actividad Reciente
              </h3>
              <button className="text-xs text-white/40 hover:text-white flex items-center gap-1">
                Ver Todo <ArrowRightIcon className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Nueva cita agendada para el paciente #{1000 + i}</p>
                    <p className="text-xs text-white/40">Hace {i * 15} minutos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Sidebar Derecho */}
        <div className="space-y-6">
          <div className="bg-[#0a0a0b] border border-white/5 rounded-sm p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Próximas Citas
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-sm border-l-2 border-blue-500">
                  <div className="text-xs text-white/60 font-mono">
                    0{9 + i}:00 AM
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white font-medium">Paciente #{2000 + i}</p>
                    <p className="text-[10px] text-white/40">Consulta General</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}