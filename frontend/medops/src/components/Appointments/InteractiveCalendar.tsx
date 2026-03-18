// src/components/Appointments/InteractiveCalendar.tsx
import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
interface ServiceSchedule {
  service: number;
  day_of_week: number; // 0 = Monday, 6 = Sunday
  start_time: string;
  end_time: string;
  slot_duration: number;
}
interface InteractiveCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  serviceSchedules: ServiceSchedule[];
  selectedServiceId: number | null;
  availableSlots: { time: string; label: string }[];
  onTimeSelect: (time: string) => void;
  selectedTime: string;
}
const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
  selectedDate,
  onDateSelect,
  serviceSchedules,
  selectedServiceId,
  availableSlots,
  onTimeSelect,
  selectedTime
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  // Calcular días disponibles del servicio seleccionado
  const availableDaysOfWeek = useMemo(() => {
    if (!selectedServiceId) return [];
    return serviceSchedules
      .filter(s => s.service === selectedServiceId)
      .map(s => s.day_of_week);
  }, [selectedServiceId, serviceSchedules]);
  // Generar calendario del mes actual
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: (Date | null)[] = [];
    
    // Días vacíos al inicio
    const startDay = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [currentMonth]);
  // Verificar si un día está disponible
  const isDayAvailable = (date: Date): boolean => {
    if (!selectedServiceId) return false;
    // Convertir día de la semana de JS (0=Sunday) a backend (0=Monday)
    const backendDay = (date.getDay() + 6) % 7;
    return availableDaysOfWeek.includes(backendDay);
  };
  // Navegación de meses
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };
  // Formatear fecha para comparación
  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  return (
    <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-4">
      {/* Header del Calendario */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-white/60" />
        </button>
        
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
          {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </h3>
        
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5 text-white/60" />
        </button>
      </div>
      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
          <div key={day} className="text-center text-[10px] text-white/40 uppercase py-1">
            {day}
          </div>
        ))}
      </div>
      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }
          const isAvailable = isDayAvailable(date);
          const isSelected = selectedDate && formatDateKey(date) === formatDateKey(selectedDate);
          const isToday = formatDateKey(date) === formatDateKey(new Date());
          return (
            <button
              key={formatDateKey(date)}
              type="button"
              onClick={() => isAvailable && onDateSelect(date)}
              disabled={!isAvailable}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-sm
                transition-all duration-200
                ${isAvailable 
                  ? 'hover:bg-emerald-500/20 cursor-pointer' 
                  : 'text-white/20 cursor-not-allowed'
                }
                ${isSelected 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500' 
                  : 'text-white'
                }
                ${isToday && !isSelected ? 'border border-white/30' : ''}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      {/* Panel de Horarios */}
      {selectedDate && availableSlots.length > 0 && (
        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-white/60 uppercase tracking-wider">
              Horarios Disponibles
            </span>
            <span className="text-xs text-emerald-400">
              {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {availableSlots.map(slot => (
              <button
                key={slot.time}
                type="button"
                onClick={() => onTimeSelect(slot.time)}
                className={`
                  py-2 px-3 text-xs rounded-sm transition-all
                  ${selectedTime === slot.time
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-800/40'
                  }
                `}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Mensaje si no hay slots disponibles */}
      {selectedDate && availableSlots.length === 0 && selectedServiceId && (
        <div className="border-t border-white/10 pt-4 mt-4 text-center text-amber-400 text-xs">
          No hay horarios disponibles para este día
        </div>
      )}
      {/* Mensaje si no hay servicio seleccionado */}
      {!selectedServiceId && (
        <div className="border-t border-white/10 pt-4 mt-4 text-center text-white/40 text-xs">
          Seleccione un servicio para ver horarios disponibles
        </div>
      )}
    </div>
  );
};
export default InteractiveCalendar;