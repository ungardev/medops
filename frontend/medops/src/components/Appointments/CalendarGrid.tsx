// src/components/Appointments/CalendarGrid.tsx
import React from 'react';
import { Appointment } from '@/types/appointments';
import { useAppointmentStatusStyles } from '@/hooks/appointments/useAppointmentStatusStyles';
interface CalendarGridProps {
  appointments: Appointment[];
  currentDate?: Date;
  onDateClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onSelectDate?: (date: Date) => void;
  onSelectAppointment?: (appointment: Appointment) => void;
}
const CalendarGrid: React.FC<CalendarGridProps> = ({
  appointments,
  currentDate = new Date(),
  onDateClick,
  onAppointmentClick,
  onSelectDate,
  onSelectAppointment,
}) => {
  const { statusStyles } = useAppointmentStatusStyles();
  // Generar colores para el calendario basados en statusStyles
  const calendarColors: Record<string, string> = {
    pending: 'border-l-4 border-yellow-500',
    tentative: 'border-l-4 border-blue-500',
    arrived: 'border-l-4 border-green-500',
    in_consultation: 'border-l-4 border-purple-500',
    completed: 'border-l-4 border-gray-500',
    canceled: 'border-l-4 border-red-500',
  };
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek };
  };
  const handleDateClick = (date: Date) => {
    if (onDateClick) onDateClick(date);
    if (onSelectDate) onSelectDate(date);
  };
  const handleAppointmentClick = (appointment: Appointment) => {
    if (onAppointmentClick) onAppointmentClick(appointment);
    if (onSelectAppointment) onSelectAppointment(appointment);
  };
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 gap-1 p-2 bg-gray-100">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 p-2">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="h-24 bg-gray-50" />
        ))}
        {days.map((day) => {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dayAppointments = appointments.filter(
            (apt) => new Date(apt.appointment_date).getDate() === day
          );
          return (
            <div
              key={day}
              onClick={() => handleDateClick(date)}
              className="h-24 border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer p-1 overflow-y-auto"
            >
              <div className="text-xs font-medium text-gray-700 mb-1">{day}</div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((appointment) => {
                  const style = statusStyles[appointment.status] || statusStyles.pending;
                  const colorClass = calendarColors[appointment.status] || calendarColors.pending;
                  return (
                    <div
                      key={appointment.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentClick(appointment);
                      }}
                      className={`text-xs p-1 rounded cursor-pointer ${colorClass} bg-opacity-20 truncate`}
                    >
                      {appointment.patient.full_name}
                    </div>
                  );
                })}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayAppointments.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default CalendarGrid;