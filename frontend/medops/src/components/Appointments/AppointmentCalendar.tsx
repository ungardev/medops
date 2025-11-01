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
  onSelect: (appointment: Appointment) => void;   // ahora abre detalle
  onSelectDate?: (date: Date) => void;
}

export default function AppointmentCalendar({ appointments, onSelect, onSelectDate }: Props) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<View>("month");

  const events: RBCEvent[] = appointments.map((appt) => {
    const start = moment(appt.appointment_date, "YYYY-MM-DD").startOf("day").toDate();
    const end = moment(appt.appointment_date, "YYYY-MM-DD").endOf("day").toDate();

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
    let bg = "var(--primary)";
    if (appt.status === "pending") bg = "var(--warning)";
    else if (appt.status === "arrived") bg = "var(--primary)";
    else if (appt.status === "in_consultation") bg = "#0ea5e9";
    else if (appt.status === "completed") bg = "var(--success)";
    else if (appt.status === "canceled") bg = "var(--danger)";

    return {
      style: {
        backgroundColor: bg,
        border: "none",
        color: "white",
        padding: "2px 4px",
        borderRadius: "4px",
        fontSize: "12px",
      },
    };
  };

  return (
    <div className="card citas-calendar">
      <Calendar
        localizer={localizer}
        date={currentDate}
        view={currentView}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="month"
        views={["month", "agenda"] as View[]}
        style={{ height: 520 }}
        popup
        selectable
        eventPropGetter={eventPropGetter}
        // 👇 ahora onSelect abre el detalle (AppointmentDetail)
        onSelectEvent={(event) => onSelect(event.resource as Appointment)}
        onSelectSlot={(slot) => onSelectDate?.(slot.start)}
        onNavigate={(newDate) => setCurrentDate(newDate)}
        onView={(newView) => setCurrentView(newView)}
      />
    </div>
  );
}
