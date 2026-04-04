// src/pages/PatientPortal/PatientDashboard.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { 
  CalendarIcon, 
  CreditCardIcon, 
  CheckCircleIcon,
  MapPinIcon,
  UserIcon,
  IdentificationIcon,
  CakeIcon,
  PhoneIcon,
  EnvelopeIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { patientClient } from '@/api/patient/client';
import { useBCVRate } from '@/hooks/dashboard/useBCVRate';
import { PatientDashboard as PatientDashboardType } from '@/types/patient';
const metricsConfig = {
  next_appointment: {
    label: "Próxima Cita",
    icon: CalendarIcon,
    color: "text-blue-400",
    href: "/patient/appointments",
  },
  past_appointments: {
    label: "Realizadas",
    icon: CheckCircleIcon,
    color: "text-emerald-400",
    href: "/patient/appointments",
  },
  subscription: {
    label: "Suscripción",
    icon: CreditCardIcon,
    color: "text-purple-400",
    href: "/patient/payments",
  },
  notifications: {
    label: "Notificaciones",
    icon: BellIcon,
    color: "text-amber-400",
    href: "/patient/notifications",
  },
};
export function PatientDashboard() {
  const [dashboard, setDashboard] = useState<PatientDashboardType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: bcvRate } = useBCVRate();
  
  const [now, setNow] = useState(moment());
  
  useEffect(() => {
    loadDashboard();
  }, []);
  
  useEffect(() => {
    const timer = setInterval(() => setNow(moment()), 1000);
    return () => clearInterval(timer);
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
  
  const bcvDisplay = bcvRate 
    ? `${Number(bcvRate.rate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs/USD`
    : "--";
  
  if (isLoading) {
    return (
      <div className="bg-white/5 border border-white/15 p-6 rounded-lg">
        <div className="flex gap-6 mb-6">
          <div className="flex-1">
            <div className="h-8 bg-white/10 rounded-lg w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-white/5 rounded-lg w-48 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 animate-pulse">
              <div className="h-3 bg-white/10 rounded-lg w-20 mb-3" />
              <div className="h-6 bg-white/5 rounded-lg w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!dashboard) return null;
  
  const nextAppointment = dashboard.upcoming_appointments?.[0];
  const nextAppointmentDate = nextAppointment 
    ? moment(nextAppointment.date).format('DD MMM YYYY')
    : null;
  
  const patientAge = dashboard.patient.age 
    ? `${dashboard.patient.age} años` 
    : "--";
  
  const unreadNotifications = dashboard.notifications?.unread_count ?? 0;
  
  return (
    <div className="bg-white/5 border border-white/15 p-4 md:p-6 rounded-lg">
      
      <div className="flex flex-col md:flex-row items-start justify-between gap-2 md:gap-4 mb-4 md:mb-6 w-full">
        
        <div className="flex-1 min-w-0 w-full">
          <div className="flex items-start gap-3">
            <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/15 items-center justify-center">
              <UserIcon className="w-6 h-6 text-white/40" />
            </div>
            
            <div className="flex-1 min-w-0 w-full">
              <h4 className="text-lg md:text-xl lg:text-2xl font-semibold text-white/90 whitespace-normal break-words w-full">
                {dashboard.patient.full_name}
              </h4>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 md:mt-2">
                {dashboard.patient.email && (
                  <div className="flex items-center gap-1.5 text-white/40">
                    <EnvelopeIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[10px] whitespace-normal break-words">
                      {dashboard.patient.email}
                    </span>
                  </div>
                )}
                {dashboard.patient.phone && (
                  <div className="flex items-center gap-1.5 text-white/40">
                    <PhoneIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[10px]">
                      {dashboard.patient.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0 w-full md:w-auto">
          <div className="flex items-center gap-2 md:gap-4 flex-wrap md:flex-nowrap">
            <span className="text-xl md:text-2xl font-semibold font-mono text-white/80 leading-none">
              {now.format("HH:mm:ss")}
            </span>
            <div className="hidden md:block h-6 w-[1px] bg-white/10"></div>
            <span className="text-[10px] text-white/40">
              {now.format("ddd, DD MMM YYYY")}
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <span className="text-[8px] text-amber-400/60">BCV:</span>
            <span className="text-[10px] font-medium text-amber-400">{bcvDisplay}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all hover:border-blue-500/20">
          <div className="flex items-center gap-2 w-full mb-3">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-blue-400/60">
              <IdentificationIcon className="h-4 w-4" />
            </div>
            <span className="text-[9px] text-white/40">
              Cédula
            </span>
          </div>
          <div className="text-lg font-medium text-white/80">
            {dashboard.patient.national_id || "--"}
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all hover:border-purple-500/20">
          <div className="flex items-center gap-2 w-full mb-3">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-purple-400/60">
              <CakeIcon className="h-4 w-4" />
            </div>
            <span className="text-[9px] text-white/40">
              Nacimiento
            </span>
          </div>
          <div className="text-lg font-medium text-white/80">
            {dashboard.patient.birthdate 
              ? moment(dashboard.patient.birthdate).format('DD/MM/YYYY')
              : "--"}
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all hover:border-emerald-500/20">
          <div className="flex items-center gap-2 w-full mb-3">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-emerald-400/60">
              <UserIcon className="h-4 w-4" />
            </div>
            <span className="text-[9px] text-white/40">
              Edad
            </span>
          </div>
          <div className="text-lg font-medium text-white/80">
            {patientAge}
          </div>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all hover:border-cyan-500/20">
          <div className="flex items-center gap-2 w-full mb-3">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-cyan-400/60">
              <PhoneIcon className="h-4 w-4" />
            </div>
            <span className="text-[9px] text-white/40">
              Teléfono
            </span>
          </div>
          <div className="text-lg font-medium text-white/80">
            {dashboard.patient.phone || "--"}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="group/card relative bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 cursor-pointer transition-all hover:border-blue-500/20">
          <Link to={metricsConfig.next_appointment.href} className="absolute inset-0 z-10" />
          <div className="flex items-center gap-2 w-full mb-3">
            <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 ${metricsConfig.next_appointment.color}`}>
              <CalendarIcon className="h-4 w-4" />
            </div>
            <span className="text-[9px] text-white/40">
              {metricsConfig.next_appointment.label}
            </span>
          </div>
          <div className="text-lg font-medium text-white/80">
            {nextAppointmentDate || "Sin citas"}
          </div>
          {nextAppointment?.doctor && (
            <div className="text-[10px] text-white/30 mt-1">
              Dr. {nextAppointment.doctor.name}
            </div>
          )}
        </div>
        
        <div className="group/card relative bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 cursor-pointer transition-all hover:border-emerald-500/20">
          <Link to={metricsConfig.past_appointments.href} className="absolute inset-0 z-10" />
          <div className="flex items-center gap-2 w-full mb-3">
            <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 ${metricsConfig.past_appointments.color}`}>
              <CheckCircleIcon className="h-4 w-4" />
            </div>
            <span className="text-[9px] text-white/40">
              {metricsConfig.past_appointments.label}
            </span>
          </div>
          <div className="text-lg font-medium text-white/80">
            {dashboard.past_appointments_count || 0}
          </div>
          <div className="text-[10px] text-white/30 mt-1">
            consultas completadas
          </div>
        </div>
        
        <div className="group/card relative bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 cursor-pointer transition-all hover:border-purple-500/20">
          <Link to={metricsConfig.subscription.href} className="absolute inset-0 z-10" />
          <div className="flex items-center gap-2 w-full mb-3">
            <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 ${metricsConfig.subscription.color}`}>
              <CreditCardIcon className="h-4 w-4" />
            </div>
            <span className="text-[9px] text-white/40">
              {metricsConfig.subscription.label}
            </span>
          </div>
          {dashboard.subscription ? (
            <>
              <div className="text-lg font-medium text-white/80 capitalize">
                {dashboard.subscription.plan}
              </div>
              <div className="text-[10px] text-white/30 mt-1">
                {dashboard.subscription.days_remaining} días restantes
              </div>
            </>
          ) : (
            <div className="text-lg font-medium text-white/30">
              --
            </div>
          )}
        </div>
        
        <div className="group/card relative bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 cursor-pointer transition-all hover:border-amber-500/20">
          <Link to={metricsConfig.notifications.href} className="absolute inset-0 z-10" />
          <div className="flex items-center gap-2 w-full mb-3">
            <div className={`p-1.5 rounded-lg bg-white/5 border border-white/10 ${metricsConfig.notifications.color}`}>
              <BellIcon className="h-4 w-4" />
            </div>
            <span className="text-[9px] text-white/40">
              {metricsConfig.notifications.label}
            </span>
          </div>
          <div className="text-lg font-medium text-white/80">
            {unreadNotifications}
          </div>
          <div className="text-[10px] text-white/30 mt-1">
            mensajes sin leer
          </div>
        </div>
      </div>
    </div>
  );
}