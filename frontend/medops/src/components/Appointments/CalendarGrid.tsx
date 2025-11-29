import moment from "moment";
import { useState } from "react";
import { Appointment } from "../../types/appointments";
import CalendarHeader from "./CalendarHeader";
import CalendarLegend from "./CalendarLegend";
import CalendarDayDetail from "./CalendarDayDetail";

interface Props {
  appointments: Appointment[];
  onSelectDate?: (date: Date) => void;
  onSelectAppointment?: (appt: Appointment) => void;
}

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
    // ⚔️ cerrar el CalendarDayDetail al seleccionar cita
    setSelectedDay(null);
    if (onSelectAppointment) onSelectAppointment(appt);
  };

  return (
    <div>
      {/* Header institucional con navegación */}
      <CalendarHeader currentMonth={currentMonth} onChangeMonth={setCurrentMonth} />

      {/* Grid mensual */}
      <div className="grid grid-cols-7 gap-px bg-[#0d2c53] dark:bg-gray-700 rounded-md overflow-hidden">
        {days.map((day) => {
          const key = day.format("YYYY-MM-DD");
          const isToday = day.isSame(moment(), "day");
          const isCurrentMonth = day.month() === currentMonth.month();
          const appts = appointmentsByDate[key] ?? [];

          return (
            <div
              key={key}
              className={`p-2 min-h-[100px] bg-white dark:bg-gray-900 text-sm 
                          ${isCurrentMonth ? "" : "opacity-50"} 
                          ${
                            isToday
                              ? "border-2 border-[#0d2c53]"
                              : "border border-gray-200 dark:border-gray-700"
                          }`}
              onClick={() => {
                setSelectedDay(day.toDate());
                onSelectDate?.(day.toDate());
              }}
            >
              <div className="font-semibold text-[#0d2c53] dark:text-gray-100 mb-1">
                {day.date()}
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[80px]">
                {appts.map((appt) => (
                  <button
                    key={appt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAppointment(appt);
                    }}
                    className={`block w-full text-left px-2 py-1 rounded-md text-xs font-medium truncate
                      ${
                        appt.status === "pending"
                          ? "bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100"
                          : appt.status === "arrived"
                          ? "bg-blue-100 dark:bg-blue-700 text-blue-800 dark:text-blue-100"
                          : appt.status === "in_consultation"
                          ? "bg-cyan-100 dark:bg-cyan-700 text-cyan-800 dark:text-cyan-100"
                          : appt.status === "completed"
                          ? "bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100"
                          : appt.status === "canceled"
                          ? "bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-100"
                          : "bg-gray-100 dark:bg-gray-700 text-[#0d2c53] dark:text-gray-100"
                      }`}
                  >
                    {appt.patient.full_name} ({appt.appointment_type})
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Leyenda institucional */}
      <CalendarLegend />

      {/* Panel de detalle del día */}
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
