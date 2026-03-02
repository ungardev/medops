import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientClient } from '@/api/patient/client';
import { PatientDashboard as PatientDashboardType } from '@/types/patient';
import { 
  CalendarIcon, 
  CreditCardIcon, 
  UserIcon,
  ClockIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
export function PatientDashboard() {
  const [dashboard, setDashboard] = useState<PatientDashboardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadDashboard();
  }, []);
  const loadDashboard = async () => {
    try {
      const response = await patientClient.getDashboard();
      setDashboard(response.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  if (!dashboard) return null;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Bienvenido, {dashboard.patient.full_name}
          </h1>
          <p className="text-slate-400">Tu centro de gestión de salud</p>
        </div>
        {dashboard.subscription && (
          <div className="px-4 py-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
            <span className="text-blue-400 text-sm font-medium">
              Plan {dashboard.subscription.plan.toUpperCase()}
            </span>
          </div>
        )}
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Next Appointment */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Próxima Cita</p>
              {dashboard.upcoming_appointments[0] ? (
                <div className="mt-2">
                  <p className="text-white font-medium">
                    {new Date(dashboard.upcoming_appointments[0].date).toLocaleDateString('es-VE')}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {dashboard.upcoming_appointments[0].doctor?.name}
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 mt-2">Sin citas programadas</p>
              )}
            </div>
            <CalendarIcon className="w-10 h-10 text-blue-400" />
          </div>
        </div>
        {/* Past Appointments */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Citas Realizadas</p>
              <p className="text-3xl font-bold text-white mt-2">
                {dashboard.past_appointments_count}
              </p>
            </div>
            <ClockIcon className="w-10 h-10 text-green-400" />
          </div>
        </div>
        {/* Subscription */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Estado de Cuenta</p>
              {dashboard.subscription?.days_remaining !== undefined ? (
                <div className="mt-2">
                  <p className="text-white font-medium capitalize">
                    {dashboard.subscription.status}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {dashboard.subscription.days_remaining} días restantes
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 mt-2">Sin suscripción activa</p>
              )}
            </div>
            <CreditCardIcon className="w-10 h-10 text-purple-400" />
          </div>
        </div>
      </div>
      {/* Quick Actions */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
        <h2 className="text-lg font-semibold text-white mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            to="/patient/appointments"
            className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <span className="text-white">Mis Citas</span>
            <ChevronRightIcon className="w-5 h-5 text-slate-400" />
          </Link>
          <Link
            to="/patient/profile"
            className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <span className="text-white">Mi Perfil</span>
            <ChevronRightIcon className="w-5 h-5 text-slate-400" />
          </Link>
          <Link
            to="/patient/payments"
            className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <span className="text-white">Mis Pagos</span>
            <ChevronRightIcon className="w-5 h-5 text-slate-400" />
          </Link>
          <Link
            to="/patient/settings"
            className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <span className="text-white">Configuración</span>
            <ChevronRightIcon className="w-5 h-5 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}