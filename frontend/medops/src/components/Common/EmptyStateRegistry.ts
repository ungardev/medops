// src/components/Common/EmptyStateRegistry.ts
import { 
  UserIcon, 
  ClockIcon, 
  DocumentIcon, 
  Cog6ToothIcon, 
  ChartBarIcon 
} from "@heroicons/react/24/outline";

export const EmptyStateRegistry = {
  pacientes: {
    icon: UserIcon,
    iconProps: { className: "w-16 h-16 text-[var(--palantir-muted)]" },
    title: "No_Records_Found",
    message: "Base de datos de sujetos vacía o sin coincidencias de búsqueda.",
  },
  salaDeEspera: {
    icon: ClockIcon,
    iconProps: { className: "w-16 h-16 text-[var(--palantir-muted)]" },
    title: "Queue_Is_Empty",
    message: "No hay flujos de pacientes activos en el buffer de espera.",
  },
  reportes: {
    icon: DocumentIcon,
    iconProps: { className: "w-16 h-16 text-[var(--palantir-muted)]" },
    title: "No_Telemetry_Available",
    message: "Inicie procesos de consulta para generar logs de analítica.",
  }
};
