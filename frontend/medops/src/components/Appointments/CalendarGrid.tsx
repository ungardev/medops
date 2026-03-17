// src/components/Appointments/CalendarGrid.tsx
import React, { useState } from 'react';
import { Appointment } from '@/types/appointments';
import { OperationalItem } from '@/types/operational';
import { useAppointmentStatusStyles } from '@/hooks/appointments/useAppointmentStatusStyles';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  XMarkIcon,
  CalendarIcon,
  ClipboardDocumentIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
interface CalendarGridProps {
  appointments?: Appointment[];
  operationalItems?: OperationalItem[]; // NUEVO: Items unificados
  currentDate?: Date;
  onDateClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  onOperationalItemClick?: (item: OperationalItem) => void;
  onSelectDate?: (date: Date) => void;
  onSelectAppointment?: (appointment: Appointment) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}
const CalendarGrid: React.FC<CalendarGridProps> = ({
  appointments = [],
  operationalItems = [],
  currentDate = new Date(),
  onDateClick,
  onAppointmentClick,
  onOperationalItemClick,
  onSelectDate,
  onSelectAppointment,
  onPrevMonth,
  onNextMonth,
}) => {
  const { statusStyles } = useAppointmentStatusStyles();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [internalDate, setInternalDate] = useState(currentDate);
  
  // Combinar citas y items operativos
  const allItems = React.useMemo(() => {
    const appointmentItems: OperationalItem[] = appointments.map(apt => ({
      id: apt.id,
      type: 'appointment' as const,
      date: apt.appointment_date,
      time: apt.tentative_time ?? undefined, // ✅ CORREGIDO: Convertir null a undefined
      title: apt.patient?.full_name || 'Cita',
      status: apt.status,
      patientName: apt.patient?.full_name,
      doctorName: apt.doctor?.full_name,
      metadata: { appointment: apt }
    }));
    
    return [...appointmentItems, ...operationalItems];
  }, [appointments, operationalItems]);
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
    setSelectedDay(date);
    if (onDateClick) onDateClick(date);
    if (onSelectDate) onSelectDate(date);
  };
  const handleAppointmentClick = (appointment: Appointment) => {
    if (onAppointmentClick) onAppointmentClick(appointment);
    if (onSelectAppointment) onSelectAppointment(appointment);
  };
  const handleOperationalItemClick = (item: OperationalItem) => {
    if (onOperationalItemClick) onOperationalItemClick(item);
    // Si es una cita, también disparar el handler de appointment
    if (item.type === 'appointment' && item.metadata?.appointment) {
      handleAppointmentClick(item.metadata.appointment);
    }
  };
  const handlePrevMonth = () => {
    const newDate = new Date(internalDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setInternalDate(newDate);
    if (onPrevMonth) onPrevMonth();
  };
  const handleNextMonth = () => {
    const newDate = new Date(internalDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setInternalDate(newDate);
    if (onNextMonth) onNextMonth();
  };
  const closeDayDetail = () => {
    setSelectedDay(null);
  };
  // ✅ CORRECCIÓN CRÍTICA: Filtrar por fecha completa (día, mes, año)
  const getItemsForDay = (day: number) => {
    return allItems.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate.getDate() === day &&
             itemDate.getMonth() === internalDate.getMonth() &&
             itemDate.getFullYear() === internalDate.getFullYear();
    });
  };
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(internalDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);
  // Obtener items del día seleccionado
  const selectedDayItems = selectedDay 
    ? allItems.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.toDateString() === selectedDay.toDateString();
      })
    : [];
  return (
    <div className="flex gap-4">
      {/* Calendario principal */}
      <div className="flex-1 bg-[#0a0a0b] border border-white/10 rounded-sm overflow-hidden">
        {/* Header del calendario con navegación */}
        <div className="flex items-center justify-between p-2 bg-[#111] border-b border-white/10">
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4 text-white/60" />
            </button>
            <span className="text-[10px] font-mono text-white/80 uppercase tracking-wider">
              {internalDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4 text-white/60" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 flex-1 mx-4">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day) => (
              <div key={day} className="text-center text-[9px] font-mono text-white/40 py-1">
                {day}
              </div>
            ))}
          </div>
        </div>
        
        {/* Grid de días */}
        <div className="grid grid-cols-7 gap-[1px] p-1 bg-[#1a1a1a]">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="h-16 bg-[#0a0a0b]" />
          ))}
          {days.map((day) => {
            const date = new Date(internalDate.getFullYear(), internalDate.getMonth(), day);
            const dayItems = getItemsForDay(day);
            const isSelected = selectedDay && selectedDay.toDateString() === date.toDateString();
            return (
              <div
                key={day}
                onClick={() => handleDateClick(date)}
                className={`h-16 bg-[#0a0a0b] border cursor-pointer p-1 overflow-y-auto transition-all ${
                  isSelected 
                    ? 'border-blue-500/50 bg-blue-500/10' 
                    : 'border-white/5 hover:border-white/20 hover:bg-[#111]'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className={`text-[9px] font-mono ${isSelected ? 'text-blue-400' : 'text-white/60'}`}>
                    {day}
                  </div>
                  {dayItems.length > 0 && (
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-blue-500/70'}`} />
                    </div>
                  )}
                </div>
                <div className="space-y-[1px]">
                  {/* Mostrar items (máximo 2) */}
                  {dayItems.slice(0, 2).map((item) => {
                    const colorClass = calendarColors[item.status] || calendarColors.pending;
                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOperationalItemClick(item);
                        }}
                        className={`${colorClass} bg-white/5 hover:bg-white/10 text-[8px] text-white/70 px-1 py-0.5 rounded cursor-pointer truncate`}
                      >
                        {item.title}
                      </div>
                    );
                  })}
                  
                  {/* Indicador de más items */}
                  {dayItems.length > 2 && (
                    <div className="text-[8px] text-white/40 text-center">
                      +{dayItems.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Panel de detalles del día seleccionado */}
      {selectedDay && (
        <div className="w-80 bg-[#0a0a0b] border border-white/10 rounded-sm overflow-hidden flex flex-col">
          {/* Header del panel */}
          <div className="flex items-center justify-between p-2 bg-[#111] border-b border-white/10">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-white/60" />
              <span className="text-[10px] font-mono text-white/80">
                {selectedDay.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </span>
            </div>
            <button 
              onClick={closeDayDetail}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-white/60" />
            </button>
          </div>
          
          {/* Tabs para Tipos de Items */}
          <div className="flex border-b border-white/10">
            <button className="flex-1 p-2 text-[10px] font-medium text-white bg-white/10 border-b-2 border-blue-500">
              <ClipboardDocumentIcon className="w-3 h-3 inline mr-1" />
              Todos
            </button>
          </div>
          
          {/* Lista de items del día */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {selectedDayItems.length > 0 ? (
              selectedDayItems.map((item) => {
                const style = statusStyles[item.status as keyof typeof statusStyles] || statusStyles.pending;
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleOperationalItemClick(item)}
                    className="bg-[#111] border border-white/10 hover:border-white/20 rounded-sm p-2 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-8 rounded-full ${style.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-medium text-white truncate">
                          {item.title}
                        </div>
                        <div className="text-[9px] text-white/40">
                          {item.doctorName || item.serviceName || 'Sin asignar'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] text-white/30 font-mono">
                            {item.time || '--:--'}
                          </span>
                          <span className={`text-[8px] px-1 rounded ${style.bg} ${style.text}`}>
                            {item.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-white/40 text-[10px]">
                No hay items programados
              </div>
            )}
          </div>
          
          {/* Footer del panel */}
          <div className="p-2 bg-[#111] border-t border-white/10">
            <div className="text-[9px] text-white/40 text-center">
              {selectedDayItems.length} item{selectedDayItems.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CalendarGrid;