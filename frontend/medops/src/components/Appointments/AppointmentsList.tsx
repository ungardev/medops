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
      const newStatus = appointment.status === 'pending' ? 'completed' : 'pending';
      onStatusChange(appointment.id, newStatus as AppointmentStatus);
    }
  };
  return (
    <div className="space-y-1">
      {appointments.map((appointment) => {
        const status = appointment.status;
        const style = statusStyles[status] || statusStyles.pending;
        
        return (
          <div
            key={appointment.id}
            onClick={() => onAppointmentClick && onAppointmentClick(appointment)}
            className="bg-[#0a0a0b] border border-white/10 hover:border-white/30 rounded-sm p-2 cursor-pointer transition-all hover:bg-[#111]"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-medium text-white truncate">
                    {appointment.patient.full_name}
                  </h3>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-[10px] text-white/50 font-mono">
                    {new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                  {appointment.tentative_time && (
                    <p className="text-[10px] text-white/50 font-mono">
                      {appointment.tentative_time}
                    </p>
                  )}
                  <p className="text-[10px] text-white/40 truncate">
                    {appointment.doctor?.full_name || 'Sin asignar'}
                  </p>
                </div>
              </div>
              
              {/* Botones de acción compactos */}
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(appointment); }}
                    className="text-[10px] text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-white/5"
                  >
                    EDIT
                  </button>
                )}
                {onStatusChange && (
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleStatusChange(appointment);
                    }}
                    className="text-[10px] text-green-400 hover:text-green-300 px-2 py-1 rounded hover:bg-white/5"
                  >
                    {appointment.status === 'pending' ? '✓' : '↺'}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-white/5"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default AppointmentsList;