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
  
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };
  
  const isWorkingDay = (date: Date) => {
    const jsDayOfWeek = date.getDay();
    const pythonDayOfWeek = jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1;
    return serviceSchedules.some(schedule => schedule.day_of_week === pythonDayOfWeek);
  };
  
  const selectedDateStr = selectedDate 
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
    : null;
  
  const days = getDaysInMonth();
  
  return (
    <div className="bg-black/30 p-4 rounded-sm border border-white/10">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => {
            const newDate = new Date(currentMonth);
            newDate.setMonth(newDate.getMonth() - 1);
            setCurrentMonth(newDate);
          }}
          className="p-2 hover:bg-white/10 rounded-full"
        >
          <ChevronLeft className="w-5 h-5 text-white/70" />
        </button>
        <span className="text-white font-medium">
          {currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
        </span>
        <button 
          onClick={() => {
            const newDate = new Date(currentMonth);
            newDate.setMonth(newDate.getMonth() + 1);
            setCurrentMonth(newDate);
          }}
          className="p-2 hover:bg-white/10 rounded-full"
        >
          <ChevronRight className="w-5 h-5 text-white/70" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-white/50 text-xs py-2 font-medium">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const currentDayStr = date 
            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            : null;
          const isSelected = currentDayStr && selectedDateStr && currentDayStr === selectedDateStr;
          
          const isWorking = date && isWorkingDay(date);
          const today = new Date();
          const isToday = date && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
          
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