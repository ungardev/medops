// src/components/Appointments/CalendarGrid.tsx
import React, { useState } from 'react';
import { Appointment, AppointmentStatus } from '@/types/appointments';
import { OperationalItem, OperationalItemType } from '@/types/operational';
import { useAppointmentStatusStyles } from '@/hooks/appointments/useAppointmentStatusStyles';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  XMarkIcon,
  CalendarIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
interface CalendarGridProps {
  appointments?: Appointment[];
  operationalItems?: OperationalItem[];
  currentDate?: Date;
  statusFilter?: AppointmentStatus | "all";
  selectedServiceId?: number | null;
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
  statusFilter = "all",
  selectedServiceId = null,
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
  const [showAvailability, setShowAvailability] = useState(true);
  
  const calendarColors: Record<string, string> = {
    pending: 'border-l-2 border-amber-500/50',
    tentative: 'border-l-2 border-blue-500/50',
    arrived: 'border-l-2 border-emerald-500/50',
    in_consultation: 'border-l-2 border-purple-500/50',
    completed: 'border-l-2 border-emerald-500/50',
    canceled: 'border-l-2 border-red-500/50',
  };
  // Helper para formatear fecha local a YYYY-MM-DD
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
  
  // FIX: Comparar fechas usando formato local para evitar timezone shift
  const getItemsForDay = (day: number) => {
    const year = internalDate.getFullYear();
    const month = String(internalDate.getMonth() + 1).padStart(2, '0');
    const targetDateStr = `${year}-${month}-${String(day).padStart(2, '0')}`;
    
    return operationalItems.filter(item => {
      return item.date === targetDateStr;
    });
  };
  
  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(internalDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);
  
  // FIX: Comparar fechas usando formato local para evitar timezone shift
  const selectedDayItems = selectedDay 
    ? operationalItems.filter(item => {
        const selectedDateStr = formatDateLocal(selectedDay);
        return item.date === selectedDateStr;
      })
    : [];
  
  const getItemsForCell = (day: number) => {
    const items = getItemsForDay(day);
    let filteredItems = showAvailability ? items : items.filter(item => item.type === 'appointment');
    
    if (selectedServiceId) {
      filteredItems = filteredItems.filter(item => item.serviceId === selectedServiceId);
    }
    
    if (statusFilter !== "all") {
      filteredItems = filteredItems.filter(item => 
        item.type === 'appointment' && item.status === statusFilter
      );
    }
    
    return filteredItems;
  };
  
  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 bg-white/5 border border-white/15 rounded-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-3 bg-white/5 border-b border-white/15">
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeftIcon className="w-4 h-4 text-white/50" />
            </button>
            <span className="text-[11px] font-medium text-white/70 capitalize">
              {internalDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronRightIcon className="w-4 h-4 text-white/50" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAvailability(!showAvailability)}
              className={`p-1.5 rounded-lg transition-colors ${
                showAvailability ? 'bg-emerald-500/15 text-emerald-400' : 'text-white/30 hover:text-white/60'
              }`}
              title={showAvailability ? 'Ocultar disponibilidad' : 'Mostrar disponibilidad'}
            >
              {showAvailability ? (
                <EyeIcon className="w-4 h-4" />
              ) : (
                <EyeSlashIcon className="w-4 h-4" />
              )}
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 flex-1 mx-4">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day) => (
              <div key={day} className="text-center text-[9px] font-medium text-white/30 py-1">
                {day}
              </div>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-[1px] p-1 bg-[#111] flex-1 overflow-y-auto">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[100px] bg-white/5" />
          ))}
          {days.map((day) => {
            const date = new Date(internalDate.getFullYear(), internalDate.getMonth(), day);
            const dayItems = getItemsForCell(day);
            const isSelected = selectedDay && selectedDay.toDateString() === date.toDateString();
            
            const hasFilteredItems = statusFilter !== "all" && dayItems.length > 0;
            
            return (
              <div
                key={day}
                onClick={() => handleDateClick(date)}
                className={`min-h-[100px] bg-white/5 border cursor-pointer p-2 overflow-hidden transition-all ${
                  isSelected 
                    ? 'border-white/30 bg-white/10' 
                    : hasFilteredItems
                    ? 'border-white/20'
                    : 'border-white/5 hover:border-white/15 hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className={`text-[10px] font-medium ${isSelected ? 'text-white' : 'text-white/50'}`}>
                    {day}
                  </div>
                  {dayItems.length > 0 && (
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-white/40'}`} />
                    </div>
                  )}
                </div>
                <div className="space-y-1 mt-1">
                  {dayItems.slice(0, 2).map((item) => {
                    const colorClass = item.type === 'availability' 
                      ? 'bg-emerald-500/10 border-l-2 border-emerald-500/30' 
                      : (calendarColors[item.status] || calendarColors.pending);
                    
                    const displayText = item.type === 'availability' 
                      ? item.time
                      : item.patientName?.split(' ')[0] || 'Cita';
                    
                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOperationalItemClick(item);
                        }}
                        className={`${colorClass} hover:bg-white/10 text-[9px] text-white/60 px-1 py-0.5 rounded cursor-pointer truncate ${
                          item.type === 'availability' ? 'text-emerald-400/70' : ''
                        }`}
                      >
                        {item.type === 'availability' ? `${displayText}` : `${displayText}`}
                      </div>
                    );
                  })}
                  
                  {dayItems.length > 2 && (
                    <div className="text-[8px] text-white/30 text-center">
                      +{dayItems.length - 2} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default CalendarGrid;