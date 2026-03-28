// src/pages/PatientPortal/PatientAppointments.tsx
import React, { useState, useEffect } from 'react';
import { Appointment } from '@/types/appointments';
import { useAppointmentStatusStyles } from '@/hooks/appointments/useAppointmentStatusStyles';
import { getAppointmentsByPatient } from '@/api/appointments';
const PatientAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { statusStyles } = useAppointmentStatusStyles();
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const storedPatientId = localStorage.getItem('patient_id');
        if (!storedPatientId) {
          setError('No se encontró ID de paciente. Por favor, inicia sesión nuevamente.');
          setLoading(false);
          return;
        }
        const patientId = Number(storedPatientId);
        const data = await getAppointmentsByPatient(patientId);
        setAppointments(data);
      } catch (err: any) {
        console.error('Error fetching appointments:', err);
        setError(err.message || 'Error al cargar las citas');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-blue-500">Cargando Citas...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-sm">
          <p className="text-[10px] font-mono text-red-500 uppercase">{error}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-[1px] w-4 bg-white/20"></div>
        <h2 className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Mis Citas</h2>
      </div>
      {appointments.length === 0 ? (
        <div className="bg-[#0a0a0b] border border-white/10 rounded-sm p-12 text-center">
          <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider">No tienes citas programadas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const status = appointment.status;
            const style = statusStyles[status] || statusStyles.pending;
            return (
              <div
                key={appointment.id}
                className="bg-[#0a0a0b] border border-white/10 rounded-sm p-5 hover:border-white/20 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[8px] font-mono text-white/30 uppercase">#{appointment.id}</span>
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-sm ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                    <h3 className="text-[12px] font-bold text-white uppercase tracking-wide mb-1">
                      {appointment.doctor?.full_name || 'Médico no asignado'}
                    </h3>
                    <p className="text-[10px] text-white/50 font-mono">
                      {new Date(appointment.appointment_date).toLocaleDateString('es-VE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    {appointment.tentative_time && (
                      <p className="text-[10px] text-white/40 font-mono mt-1">
                        Hora: {appointment.tentative_time}
                      </p>
                    )}
                    {appointment.institution && (
                      <p className="text-[9px] text-white/30 font-mono mt-1">
                        {typeof appointment.institution === 'object'
                          ? (appointment.institution as any).name || 'Institución'
                          : String(appointment.institution)}
                      </p>
                    )}
                  </div>
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