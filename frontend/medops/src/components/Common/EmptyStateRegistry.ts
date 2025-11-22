// src/components/Common/EmptyStateRegistry.ts
import { ComponentType } from "react";
import {
  UserIcon,
  ClockIcon,
  DocumentIcon,
  Cog6ToothIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

type IconComponent = ComponentType<React.SVGProps<SVGSVGElement>>;

interface EmptyStateEntry {
  icon: IconComponent;
  iconProps?: React.SVGProps<SVGSVGElement>;
  title: string;
  message?: string;
}

export const EmptyStateRegistry: Record<string, EmptyStateEntry> = {
  pacientes: {
    icon: UserIcon,
    iconProps: { className: "w-12 h-12 text-gray-400 dark:text-gray-500" },
    title: "No se encontraron pacientes",
    message: "Intenta ajustar tu búsqueda o registrar un nuevo paciente.",
  },
  salaDeEspera: {
    icon: ClockIcon,
    iconProps: { className: "w-12 h-12 text-gray-400 dark:text-gray-500" },
    title: "No hay pacientes en sala de espera",
    message: "Los pacientes aparecerán aquí cuando sean registrados.",
  },
  reportes: {
    icon: DocumentIcon,
    iconProps: { className: "w-12 h-12 text-gray-400 dark:text-gray-500" },
    title: "No hay reportes disponibles",
    message: "Genera un nuevo reporte para visualizar resultados.",
  },
  configuracion: {
    icon: Cog6ToothIcon,
    iconProps: { className: "w-12 h-12 text-gray-400 dark:text-gray-500" },
    title: "Sin configuraciones definidas",
    message: "Configura tu institución para comenzar.",
  },
  dashboard: {
    icon: ChartBarIcon,
    iconProps: { className: "w-12 h-12 text-gray-400 dark:text-gray-500" },
    title: "No hay datos en el dashboard",
    message: "Los indicadores aparecerán aquí cuando se registren eventos.",
  },
};
