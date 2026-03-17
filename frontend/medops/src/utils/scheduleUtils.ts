import { ServiceSchedule } from '@/types/services';
import { OperationalItem } from '@/types/operational';
export const generateAvailabilityFromSchedules = (
  schedules: ServiceSchedule[], 
  month: Date
): OperationalItem[] => {
  const availability: OperationalItem[] = [];
  const year = month.getFullYear();
  const monthNum = month.getMonth();
  
  const daysInMonth = new Date(year, monthNum + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum, day);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ...
    
    // Filtrar horarios que apliquen a este día (ajustar según tu lógica de días)
    const daySchedules = schedules.filter(s => s.day_of_week === dayOfWeek);
    
    daySchedules.forEach(schedule => {
      const startTime = new Date(`2000-01-01T${schedule.start_time}`);
      const endTime = new Date(`2000-01-01T${schedule.end_time}`);
      const slotDuration = schedule.slot_duration;
      
      let currentTime = startTime;
      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000);
        if (slotEnd <= endTime) {
          availability.push({
            id: `slot-${schedule.service}-${day}-${currentTime.getHours()}-${currentTime.getMinutes()}`,
            type: 'availability',
            date: date.toISOString().split('T')[0],
            time: currentTime.toTimeString().slice(0, 5),
            title: 'Disponible',
            status: 'available',
            isAvailable: true, // ✅ AGREGADO: Propiedad requerida
            metadata: {
              service_id: schedule.service,
              schedule_id: schedule.id,
              slot_duration: schedule.slot_duration,
              max_appointments: schedule.max_appointments
            }
          });
        }
        currentTime = slotEnd;
      }
    });
  }
  
  return availability;
};