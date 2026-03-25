// src/components/Common/SimpleCalendar.tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
interface SimpleCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  serviceSchedules: any[];
}
const SimpleCalendar: React.FC<SimpleCalendarProps> = ({
  selectedDate,
  onDateSelect,
  serviceSchedules
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Días de la semana
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  // Generar días del mes
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };
  
  // Verificar si un día es laboral
  const isWorkingDay = (date: Date) => {
    const dayOfWeek = date.getDay();
    return serviceSchedules.some(schedule => schedule.day_of_week === dayOfWeek);
  };
  
  const days = getDaysInMonth();
  
  return (
    <div className="bg-black/30 p-4 rounded-sm border border-white/10">
      {/* Controles de mes */}
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
          className="p-2 hover:bg-white/10 rounded-full"
        >
          <ChevronLeft className="w-5 h-5 text-white/70" />
        </button>
        <span className="text-white font-medium">
          {currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
        </span>
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
          className="p-2 hover:bg-white/10 rounded-full"
        >
          <ChevronRight className="w-5 h-5 text-white/70" />
        </button>
      </div>
      
      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-white/50 text-xs py-2 font-medium">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();
          const isWorking = date && isWorkingDay(date);
          const isToday = date && date.toDateString() === new Date().toDateString();
          
          return (
            <button
              key={index}
              onClick={() => date && onDateSelect(date)}
              disabled={!date}
              className={`
                relative p-2 text-center rounded-sm transition-all
                ${!date ? 'invisible' : 'hover:bg-white/10 cursor-pointer'}
                ${isSelected ? 'bg-emerald-500 text-black font-bold' : 'text-white'}
                ${isToday && !isSelected ? 'border border-emerald-500/50' : ''}
              `}
            >
              {date ? date.getDate() : ''}
              {/* Indicador de día laboral */}
              {date && isWorking && (
                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default SimpleCalendar;