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
  
  // Colores para el calendario en tema oscuro
  const calendarColors: Record<string, string> = {
    pending: 'border-l-2 border-yellow-500/70',
    tentative: 'border-l-2 border-blue-500/70',
    arrived: 'border-l-2 border-green-500/70',
    in_consultation: 'border-l-2 border-purple-500/70',
    completed: 'border-l-2 border-gray-500/70',
    canceled: 'border-l-2 border-red-500/70',
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
    <div className="bg-[#0a0a0b] border border-white/10 rounded-sm overflow-hidden">
      {/* Header del calendario */}
      <div className="grid grid-cols-7 gap-1 p-2 bg-[#111] border-b border-white/10">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
          <div key={day} className="text-center text-[10px] font-mono text-white/60 py-1 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
      
      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-[1px] p-1 bg-[#1a1a1a]">
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="h-20 bg-[#0a0a0b]" />
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
              className="h-20 bg-[#0a0a0b] border border-white/5 hover:border-white/20 hover:bg-[#111] cursor-pointer p-1 overflow-y-auto transition-all"
            >
              <div className="text-[10px] font-mono text-white/80 mb-1">{day}</div>
              <div className="space-y-[2px]">
                {dayAppointments.slice(0, 3).map((appointment) => {
                  const colorClass = calendarColors[appointment.status] || calendarColors.pending;
                  return (
                    <div
                      key={appointment.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentClick(appointment);
                      }}
                      className={`${colorClass} bg-white/5 hover:bg-white/10 text-[9px] text-white/80 px-1 py-0.5 rounded cursor-pointer truncate`}
                    >
                      {appointment.patient.full_name.split(' ')[0]}
                    </div>
                  );
                })}
                {dayAppointments.length > 3 && (
                  <div className="text-[9px] text-white/40 text-center">
                    +{dayAppointments.length - 3}
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