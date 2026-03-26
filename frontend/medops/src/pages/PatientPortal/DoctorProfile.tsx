// src/pages/PatientPortal/DoctorProfile.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDoctor, useDoctorServices } from '@/hooks/doctor/useDoctor';
import { DoctorProfileCard } from '@/components/Doctor/DoctorProfileCard';
import { ServicePurchaseFlow } from '@/components/Doctor/ServicePurchaseFlow';
import PageHeader from '@/components/Common/PageHeader';
import { Clock } from 'lucide-react';
export default function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const doctorId = parseInt(id || '0');
  
  const { data: doctor, isLoading: doctorLoading } = useDoctor(doctorId);
  const { data: services, isLoading: servicesLoading } = useDoctorServices(doctorId);
  
  const [selectedService, setSelectedService] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  // Efecto para actualizar el reloj
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  if (doctorLoading || servicesLoading) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6 min-h-screen flex items-center justify-center">
        <div className="text-white p-8 bg-black/40 border border-white/10 rounded-lg">
          Cargando perfil...
        </div>
      </div>
    );
  }
  
  if (!doctor) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 lg:p-6 min-h-screen flex items-center justify-center">
        <div className="text-white p-8 bg-black/40 border border-white/10 rounded-lg">
          Doctor no encontrado
        </div>
      </div>
    );
  }
  
  const currentPatientId = localStorage.getItem('patient_id') ? Number(localStorage.getItem('patient_id')) : 1;
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6 bg-black min-h-screen">
      {/* PageHeader con Breadcrumbs */}
      <div className="flex items-center justify-between">
        <PageHeader 
          breadcrumbs={[
            { label: "MEDOPZ", path: "/patient" },
            { label: "Perfiles", path: "/patient/search" },
            { label: doctor.full_name, active: true }
          ]}
        />
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Clock className="w-4 h-4" />
          <span>{currentTime.toLocaleTimeString()}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil del Doctor - Columna Izquierda */}
        <div className="lg:col-span-1">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-lg p-6 shadow-2xl sticky top-4">
            <DoctorProfileCard doctor={doctor} mode="view" />
            
            {/* Biografía Sección */}
            {doctor.bio && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="text-white/80 text-xs font-mono uppercase tracking-wider mb-2">
                  Biografía
                </h4>
                <p className="text-white/70 text-sm leading-relaxed">
                  {doctor.bio}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Servicios - Columna Derecha */}
        <div className="lg:col-span-2">
          <h2 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
            Servicios Disponibles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services?.map((service) => (
              <div 
                key={service.id} 
                className="group bg-[#0a0a0b] border border-white/10 rounded-lg p-5 hover:border-emerald-500/50 transition-all duration-300 shadow-lg"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-white/50 text-xs mt-1">
                      Duración: {service.duration_minutes} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-mono text-xl font-bold">
                      ${service.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                
                {service.description && (
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>
                )}
                
                <button
                  onClick={() => setSelectedService(service)}
                  className="w-full py-3 bg-emerald-500 text-black text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
                >
                  Reservar Ahora
                </button>
              </div>
            ))}
          </div>
          
          {services?.length === 0 && (
            <div className="text-center py-12 text-white/50">
              No hay servicios disponibles para este médico en este momento.
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de Compra */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <ServicePurchaseFlow
              service={selectedService}
              patientId={currentPatientId}
              onSuccess={() => {
                setSelectedService(null);
              }}
              onCancel={() => setSelectedService(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}