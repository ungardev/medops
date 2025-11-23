// src/components/Appointments/CalendarDayDetail.tsx
import moment from "moment";
import { Appointment } from "../../types/appointments";

interface Props {
  date: Date;
  appointments: Appointment[];
  onClose: () => void;
  onSelectAppointment: (appt: Appointment) => void; // 🔹 ahora es obligatorio
}

export default function CalendarDayDetail({ date, appointments, onClose, onSelectAppointment }: Props) {
  const dayAppointments = appointments.filter((appt) =>
    moment(appt.appointment_date, "YYYY-MM-DD").isSame(date, "day")
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Citas del {moment(date).format("DD/MM/YYYY")}
          </h2>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                       hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm"
          >
            Cerrar
          </button>
        </div>

        {/* Lista de citas */}
        {dayAppointments.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No hay citas registradas para este día.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {dayAppointments.map((appt) => (
              <li
                key={appt.id}
                className="py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 rounded-md"
                onClick={() => onSelectAppointment(appt)} // 🔹 abre directamente AppointmentDetail
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {appt.patient.full_name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {appt.appointment_type} — {appt.status}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-semibold
                      ${
                        appt.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100"
                          : appt.status === "arrived"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100"
                          : appt.status === "in_consultation"
                          ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-700 dark:text-cyan-100"
                          : appt.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100"
                          : appt.status === "canceled"
                          ? "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                      }`}
                  >
                    {moment(appt.appointment_date).format("HH:mm")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
