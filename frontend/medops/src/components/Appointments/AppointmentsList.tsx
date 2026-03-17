// src/components/Appointments/AppointmentsList.tsx
import React from 'react';
import { Appointment, AppointmentStatus } from '@/types/appointments';
import { useAppointmentStatusStyles } from '@/hooks/appointments/useAppointmentStatusStyles';
import { 
  PencilSquareIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';
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
    <div className="space-y-[2px]">
      {appointments.map((appointment) => {
        const status = appointment.status;
        const style = statusStyles[status] || statusStyles.pending;
        
        // ✅ MANEJO SEGURO DE DATOS
        const patientName = appointment.patient?.full_name || 'Sin nombre';
        const doctorName = appointment.doctor?.full_name || 'Sin asignar';
        
        return (
          <div
            key={appointment.id}
            onClick={() => onAppointmentClick && onAppointmentClick(appointment)}
            className="bg-[#0a0a0b] border border-white/5 hover:border-white/15 rounded-sm p-2 cursor-pointer transition-all hover:bg-[#111] group"
          >
            <div className="flex items-center justify-between gap-2">
              {/* Info principal */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Indicador de estado */}
                <div className={`w-1 h-8 rounded-full ${style.dot}`} />
                
                {/* Detalles */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-white truncate">
                      {patientName}
                    </span>
                    <span className="text-[9px] text-white/40 font-mono">
                      {new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </span>
                    {appointment.tentative_time && (
                      <span className="text-[9px] text-white/40 font-mono">
                        {appointment.tentative_time}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-white/30 truncate">
                      {doctorName}
                    </span>
                    <span className={`text-[8px] px-1 rounded ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Botones de acción con iconos */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(appointment); }}
                    className="p-1.5 text-white/40 hover:text-blue-400 hover:bg-white/5 rounded transition-all"
                    title="Editar"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5" />
                  </button>
                )}
                {onStatusChange && (
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleStatusChange(appointment);
                    }}
                    className="p-1.5 text-white/40 hover:text-green-400 hover:bg-white/5 rounded transition-all"
                    title={appointment.status === 'pending' ? 'Completar' : 'Reabrir'}
                  >
                    {appointment.status === 'pending' ? (
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1.5 text-white/40 hover:text-red-400 hover:bg-white/5 rounded transition-all"
                    title="Eliminar"
                  >
                    <XCircleIcon className="w-3.5 h-3.5" />
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