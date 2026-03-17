// frontend/medops/src/hooks/appointments/useAppointmentStatusStyles.ts
import { AppointmentStatus } from '@/types/appointments';
export interface StatusStyle {
  label: string;
  bg: string;      // Clase de fondo (Tailwind)
  text: string;    // Clase de texto (Tailwind)
  dot: string;     // Clase de punto/badge (Tailwind)
}
export type StatusStylesMap = Record<AppointmentStatus, StatusStyle>;
export const useAppointmentStatusStyles = () => {
  const statusStyles: StatusStylesMap = {
    pending: {
      label: 'Pendiente',
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      dot: 'bg-yellow-500',
    },
    tentative: {
      label: 'Programado',
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      dot: 'bg-blue-500',
    },
    arrived: {
      label: 'Llegó',
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-500',
    },
    in_consultation: {
      label: 'En Consulta',
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      dot: 'bg-purple-500',
    },
    completed: {
      label: 'Completada',
      bg: 'bg-emerald-100',      // ✅ CAMBIO: De bg-gray-100 a bg-emerald-100
      text: 'text-emerald-800',  // ✅ CAMBIO: De text-gray-800 a text-emerald-800
      dot: 'bg-emerald-500',     // ✅ CAMBIO: De bg-gray-500 a bg-emerald-500
    },
    canceled: {
      label: 'Cancelada',
      bg: 'bg-red-100',
      text: 'text-red-800',
      dot: 'bg-red-500',
    },
  };
  
  const getStatusStyle = (status: AppointmentStatus): StatusStyle => {
    return statusStyles[status] || statusStyles.pending;
  };
  
  return { statusStyles, getStatusStyle };
};
export default useAppointmentStatusStyles;