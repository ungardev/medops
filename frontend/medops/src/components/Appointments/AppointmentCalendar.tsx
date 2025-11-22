// src/components/Appointments/AppointmentCalendar.tsx
import { Calendar, momentLocalizer, Event as RBCEvent, View } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import { Appointment } from "../../types/appointments";

moment.locale("es");
const localizer = momentLocalizer(moment);

interface Props {
  appointments: Appointment[];
  onSelect: (appointment: Appointment) => void;
  onSelectDate?: (date: Date) => void;
}

export default function AppointmentCalendar({ appointments, onSelect, onSelectDate }: Props) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<View>("month");

  const events: RBCEvent[] = appointments.map((appt) => {
    const baseDate =
      appt.status === "completed" && appt.completed_at
        ? moment(appt.completed_at)
        : moment(appt.appointment_date, "YYYY-MM-DD");

    const start = baseDate.startOf("day").toDate();
    const end = baseDate.endOf("day").toDate();

    return {
      id: appt.id,
      title: `${appt.patient.full_name} (${appt.appointment_type}) - ${appt.status}`,
      start,
      end,
      allDay: true,
      resource: appt,
    };
  });

  const eventPropGetter = (event: RBCEvent) => {
    const appt = event.resource as Appointment;
    let bg = "#2563eb"; // azul institucional por defecto

    if (appt.status === "pending") bg = "#facc15"; // amarillo
    else if (appt.status === "arrived") bg = "#3b82f6"; // azul
    else if (appt.status === "in_consultation") bg = "#0ea5e9"; // celeste
    else if (appt.status === "completed") bg = "#22c55e"; // verde
    else if (appt.status === "canceled") bg = "#ef4444"; // rojo

    return {
      style: {
        backgroundColor: bg,
        border: "none",
        color: "white",
        padding: "2px 6px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 500,
      },
    };
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 bg-white dark:bg-gray-900">
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Calendario de Citas</h3>
      <div className="h-[520px]">
        <Calendar
          localizer={localizer}
          date={currentDate}
          view={currentView}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView="month"
          views={["month", "agenda"] as View[]}
          popup
          selectable
          eventPropGetter={eventPropGetter}
          onSelectEvent={(event) => onSelect(event.resource as Appointment)}
          onSelectSlot={(slot) => onSelectDate?.(slot.start)}
          onNavigate={(newDate) => setCurrentDate(newDate)}
          onView={(newView) => setCurrentView(newView)}
        />
      </div>
    </div>
  );
}
