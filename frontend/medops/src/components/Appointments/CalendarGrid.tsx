// src/components/Appointments/CalendarGrid.tsx
import moment from "moment";
import { useState } from "react";
import { Appointment, AppointmentStatus } from "../../types/appointments";
import CalendarHeader from "./CalendarHeader";
import CalendarLegend from "./CalendarLegend";
import CalendarDayDetail from "./CalendarDayDetail";

interface Props {
  appointments: Appointment[];
  onSelectDate?: (date: Date) => void;
  onSelectAppointment?: (appt: Appointment) => void;
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: "bg-amber-500",
  arrived: "bg-blue-400",
  in_consultation: "bg-indigo-400",
  completed: "bg-emerald-500",
  canceled: "bg-red-500",
};

export default function CalendarGrid({ appointments, onSelectDate, onSelectAppointment }: Props) {
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const startOfMonth = currentMonth.clone().startOf("month").startOf("week");
  const endOfMonth = currentMonth.clone().endOf("month").endOf("week");

  const days: moment.Moment[] = [];
  const current = startOfMonth.clone();
  while (current.isBefore(endOfMonth)) {
    days.push(current.clone());
    current.add(1, "day");
  }

  const appointmentsByDate: Record<string, Appointment[]> = {};
  for (const appt of appointments) {
    const key = moment(appt.appointment_date).format("YYYY-MM-DD");
    if (!appointmentsByDate[key]) appointmentsByDate[key] = [];
    appointmentsByDate[key].push(appt);
  }

  const handleSelectAppointment = (appt: Appointment) => {
    setSelectedDay(null);
    if (onSelectAppointment) onSelectAppointment(appt);
  };

  return (
    <div className="space-y-4">
      {/* Header técnico de navegación */}
      <CalendarHeader currentMonth={currentMonth} onChangeMonth={setCurrentMonth} />

      {/* Grid Principal */}
      <div className="grid grid-cols-7 gap-[1px] bg-[var(--palantir-border)] border border-[var(--palantir-border)] overflow-hidden">
        {/* Header de días de la semana */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-black/40 py-2 text-center text-[9px] font-black text-[var(--palantir-muted)] uppercase tracking-[0.2em]">
            {d}
          </div>
        ))}

        {days.map((day) => {
          const key = day.format("YYYY-MM-DD");
          const isToday = day.isSame(moment(), "day");
          const isCurrentMonth = day.month() === currentMonth.month();
          const appts = appointmentsByDate[key] ?? [];

          return (
            <div
              key={key}
              onClick={() => {
                setSelectedDay(day.toDate());
                onSelectDate?.(day.toDate());
              }}
              className={`relative min-h-[100px] p-2 transition-all cursor-pointer group
                ${isCurrentMonth ? 'bg-[var(--palantir-surface)]' : 'bg-black/20 opacity-40'}
                ${isToday ? 'ring-1 ring-inset ring-[var(--palantir-active)] z-10 shadow-[inset_0_0_10px_rgba(30,136,229,0.1)]' : 'hover:bg-white/5'}
              `}
            >
              {/* Número del día */}
              <div className={`text-[11px] font-mono mb-2 ${isToday ? 'text-[var(--palantir-active)] font-black' : 'text-[var(--palantir-muted)]'}`}>
                {day.date().toString().padStart(2, '0')}
              </div>

              {/* Contenedor de Citas */}
              <div className="space-y-1">
                {appts.slice(0, 3).map((appt) => (
                  <button
                    key={appt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAppointment(appt);
                    }}
                    className="w-full flex items-center gap-1.5 px-1.5 py-0.5 bg-black/30 border-l-2 border-current hover:bg-black/50 transition-colors group/btn"
                    style={{ borderColor: `var(--status-${appt.status}, ${STATUS_COLORS[appt.status]})` }}
                  >
                    <div className={`w-1 h-1 shrink-0 ${STATUS_COLORS[appt.status]} rounded-full`} />
                    <span className="text-[9px] font-mono uppercase truncate text-[var(--palantir-text)] opacity-80 group-hover/btn:opacity-100">
                      {appt.patient.full_name}
                    </span>
                  </button>
                ))}
                
                {appts.length > 3 && (
                  <div className="text-[8px] font-mono text-[var(--palantir-active)] uppercase tracking-tighter pl-1">
                    + {appts.length - 3} MORE_RECORDS
                  </div>
                )}
              </div>

              {/* Indicador visual de "Carga de datos" en el borde inferior */}
              {appts.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-[1px] flex gap-px px-1">
                  {appts.map((a, i) => (
                    <div key={i} className={`h-full flex-1 ${STATUS_COLORS[a.status]}`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda y Detalles */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <CalendarLegend />
      </div>

      {selectedDay && (
        <CalendarDayDetail
          date={selectedDay}
          appointments={appointments}
          onClose={() => setSelectedDay(null)}
          onSelectAppointment={handleSelectAppointment}
        />
      )}
    </div>
  );
}
