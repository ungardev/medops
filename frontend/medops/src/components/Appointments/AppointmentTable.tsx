// src/components/Appointments/AppointmentTable.tsx
import React from 'react';
import { Appointment } from '@/types/appointments';
import { useAppointmentStatusStyles } from '@/hooks/appointments/useAppointmentStatusStyles';
interface AppointmentTableProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}
const AppointmentTable: React.FC<AppointmentTableProps> = ({
  appointments,
  onAppointmentClick,
}) => {
  const { getStatusStyle } = useAppointmentStatusStyles();
  // Definir colores para el calendario (opcional, si se usa en esta tabla)
  const calendarColors: Record<string, string> = {
    pending: 'bg-yellow-200',
    tentative: 'bg-blue-200',
    arrived: 'bg-green-200',
    in_consultation: 'bg-purple-200',
    completed: 'bg-gray-200',
    canceled: 'bg-red-200',
  };
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Paciente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Médico
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {appointments.map((appointment) => {
            const statusStyle = getStatusStyle(appointment.status);
            return (
              <tr
                key={appointment.id}
                onClick={() => onAppointmentClick(appointment)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {appointment.patient.full_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(appointment.appointment_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    {statusStyle.label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {appointment.doctor?.full_name || 'Sin asignar'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
export default AppointmentTable;