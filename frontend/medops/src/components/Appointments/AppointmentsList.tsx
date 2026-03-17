// src/components/Appointments/AppointmentsList.tsx
import React from 'react';
import { Appointment, AppointmentStatus } from '@/types/appointments';
import { useAppointmentStatusStyles } from '@/hooks/appointments/useAppointmentStatusStyles';
interface AppointmentsListProps {
  appointments: Appointment[];
  onAppointmentClick?: (appointment: Appointment) => void;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: () => void;
  onStatusChange?: (id: number, status: AppointmentStatus) => void;
}
const AppointmentsList: React.FC<AppointmentsListProps> = ({
  appointments,
  onAppointmentClick,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const { statusStyles } = useAppointmentStatusStyles();
  const handleStatusChange = (appointment: Appointment) => {
    if (onStatusChange) {
      // Alternar entre pending y completed como ejemplo
      const newStatus = appointment.status === 'pending' ? 'completed' : 'pending';
      onStatusChange(appointment.id, newStatus as AppointmentStatus);
    }
  };
  return (
    <div className="space-y-4">
      {appointments.map((appointment) => {
        const status = appointment.status;
        const style = statusStyles[status] || statusStyles.pending;
        return (
          <div
            key={appointment.id}
            onClick={() => onAppointmentClick && onAppointmentClick(appointment)}
            className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-md ${style.bg}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {appointment.patient.full_name}
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(appointment.appointment_date).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${style.bg} ${style.text}`}
              >
                {style.label}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>Médico: {appointment.doctor?.full_name || 'No asignado'}</p>
              {appointment.tentative_time && (
                <p>Hora: {appointment.tentative_time}</p>
              )}
            </div>
            
            {/* Botones de acción */}
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end gap-2">
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(appointment); }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Editar
                </button>
              )}
              {onStatusChange && (
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    handleStatusChange(appointment);
                  }}
                  className="text-xs text-green-600 hover:text-green-800 font-medium"
                >
                  {appointment.status === 'pending' ? 'Marcar Completada' : 'Reabrir'}
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default AppointmentsList;