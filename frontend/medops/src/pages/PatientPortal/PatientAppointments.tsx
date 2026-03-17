// src/pages/PatientPortal/PatientAppointments.tsx
import React, { useState, useEffect } from 'react';
import { Appointment } from '@/types/appointments';
import { useAppointmentStatusStyles } from '@/hooks/appointments/useAppointmentStatusStyles';
import { getAppointmentsByPatient } from '@/api/appointments';
const PatientAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { statusStyles } = useAppointmentStatusStyles();
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // Aquí deberías obtener el ID del paciente autenticado
        const patientId = 1; // Ejemplo: reemplazar con lógica real
        const data = await getAppointmentsByPatient(patientId);
        setAppointments(data);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Mis Citas</h2>
      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No tienes citas programadas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const status = appointment.status;
            const style = statusStyles[status] || statusStyles.pending;
            return (
              <div
                key={appointment.id}
                className={`p-4 rounded-lg shadow-sm border-l-4 ${style.bg} border-opacity-50`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Cita con {appointment.doctor?.full_name || 'Médico no asignado'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.appointment_date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {appointment.tentative_time && (
                      <p className="text-sm text-gray-600">
                        Hora: {appointment.tentative_time}
                      </p>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${style.bg} ${style.text}`}
                  >
                    {style.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default PatientAppointments;